extends Node2D

const VIEWPORT_SIZE := Vector2(1280, 720)
const BACKGROUND_TEXTURE := preload("res://assets/mongle/background.png")
const CHIEF_HOUSE_TEXTURE := preload("res://assets/mongle/chief_house.png")
const HOUSE_TEXTURE := preload("res://assets/mongle/house.png")
const CHIEF_TEXTURE := preload("res://assets/characters/몽글이장님.png")
const KOREAN_FONT := preload("res://assets/fonts/NotoSansKR-Regular.ttf")

const CHIEF_HOUSE_SIZE := Vector2(228, 194)
const RESIDENT_HOUSE_SIZE := Vector2(156, 118)
const HOUSE_GAP := 4.0
const MAX_RESIDENTS := 10

var rng := RandomNumberGenerator.new()
var occupied_rects: Array[Rect2] = []
var walkers: Array[Node2D] = []
var camera: Camera2D
var info_label: Label
var info_tween: Tween
var walk_bounds := Rect2(Vector2(240, 88), Vector2(680, 420))


func _ready() -> void:
	rng.seed = 20260527
	RenderingServer.set_default_clear_color(Color("#8fcf65"))

	camera = Camera2D.new()
	camera.position = VIEWPORT_SIZE / 2.0
	camera.zoom = Vector2.ONE
	camera.enabled = true
	add_child(camera)

	_build_village()
	_add_info_label()


func _process(delta: float) -> void:
	for walker in walkers:
		_update_walker(walker, delta)


func _build_village() -> void:
	var map_root := Node2D.new()
	map_root.name = "MongleVillage"
	add_child(map_root)

	_add_background(map_root)
	var chief_house_rect := _add_chief_house(map_root)
	occupied_rects.append(chief_house_rect.grow(HOUSE_GAP))

	var resident_names := _resident_names()
	var resident_avatars := _resident_avatars()
	var house_infos := _add_resident_houses(map_root, resident_names)

	_add_walker(map_root, CHIEF_TEXTURE, Vector2(chief_house_rect.get_center().x, chief_house_rect.end.y + 38.0), "몽글이장님", Color.WHITE, 0.22)

	for index in house_infos.size():
		var house_info: Dictionary = house_infos[index]
		var house_rect: Rect2 = house_info["rect"]
		var owner_name: String = house_info["name"]
		var start_position := _safe_start_near_house(house_rect)
		var tint := _resident_tint(owner_name)
		var avatar_url := ""
		if index < resident_avatars.size():
			avatar_url = resident_avatars[index]
		_add_walker(map_root, CHIEF_TEXTURE, start_position, owner_name, tint, 0.16, avatar_url)


func _add_background(parent: Node2D) -> void:
	var background := Sprite2D.new()
	background.name = "VillageBackground"
	background.texture = BACKGROUND_TEXTURE
	background.centered = false
	var texture_size := Vector2(BACKGROUND_TEXTURE.get_width(), BACKGROUND_TEXTURE.get_height())
	background.scale = Vector2(VIEWPORT_SIZE.x / texture_size.x, VIEWPORT_SIZE.y / texture_size.y)
	background.z_index = -100
	parent.add_child(background)


func _add_chief_house(parent: Node2D) -> Rect2:
	var rect := Rect2((VIEWPORT_SIZE - CHIEF_HOUSE_SIZE) / 2.0 + Vector2(0, -28), CHIEF_HOUSE_SIZE)
	var house := Sprite2D.new()
	house.name = "ChiefHouse"
	house.texture = CHIEF_HOUSE_TEXTURE
	house.centered = true
	house.position = rect.get_center()
	house.scale = _fit_texture_scale(CHIEF_HOUSE_TEXTURE, CHIEF_HOUSE_SIZE)
	house.z_index = int(rect.end.y)
	parent.add_child(house)
	_add_click_area(parent, rect, "chief_house", "")
	return rect


func _add_resident_houses(parent: Node2D, resident_names: Array[String]) -> Array[Dictionary]:
	var house_infos: Array[Dictionary] = []
	var slots := _house_slots()

	for owner_name in resident_names:
		for slot in slots:
			if not _is_slot_clear(slot):
				continue

			_add_resident_house(parent, slot, owner_name)
			occupied_rects.append(slot.grow(HOUSE_GAP))
			house_infos.append({"name": owner_name, "rect": slot})
			break

	return house_infos


func _add_resident_house(parent: Node2D, rect: Rect2, owner_name: String) -> void:
	var house := Sprite2D.new()
	house.name = "%sHouse" % owner_name
	house.texture = HOUSE_TEXTURE
	house.centered = true
	house.position = rect.get_center()
	house.scale = _fit_texture_scale(HOUSE_TEXTURE, RESIDENT_HOUSE_SIZE)
	house.z_index = int(rect.end.y)
	parent.add_child(house)
	_add_click_area(parent, rect, "resident_house", owner_name)


func _add_click_area(parent: Node2D, rect: Rect2, feature: String, owner_name: String) -> void:
	var area := Area2D.new()
	area.name = "%sClickArea" % feature
	area.position = rect.get_center()
	area.set_meta("feature", feature)
	area.set_meta("owner_name", owner_name)
	area.set_meta("bounds", rect)

	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = rect.size
	shape.shape = rectangle
	area.add_child(shape)

	area.input_event.connect(_on_entity_input.bind(area))
	parent.add_child(area)


func _add_walker(parent: Node2D, texture: Texture2D, start_position: Vector2, label_text: String, tint: Color, scale_size: float, avatar_url: String = "") -> void:
	var walker := Node2D.new()
	walker.name = "%sWalker" % label_text
	walker.position = _safe_walk_position(start_position)
	walker.z_index = int(walker.position.y)
	walker.set_meta("target", _random_walk_position())
	walker.set_meta("speed", rng.randf_range(46.0, 74.0))
	walker.set_meta("bob_phase", rng.randf_range(0.0, TAU))

	var sprite := Sprite2D.new()
	sprite.name = "Sprite2D"
	sprite.texture = texture
	sprite.centered = true
	sprite.modulate = tint
	var longest_side := maxf(texture.get_width(), texture.get_height())
	sprite.scale = Vector2.ONE * ((VIEWPORT_SIZE.y * scale_size) / longest_side)
	sprite.set_meta("scale_size", scale_size)
	walker.add_child(sprite)

	if label_text == "몽글이장님":
		var name_label := Label.new()
		name_label.text = label_text
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_label.position = Vector2(-42, -96)
		name_label.size = Vector2(84, 24)
		name_label.add_theme_font_override("font", KOREAN_FONT)
		name_label.add_theme_font_size_override("font_size", 15)
		name_label.add_theme_color_override("font_color", Color("#fff6cc"))
		name_label.add_theme_color_override("font_outline_color", Color("#3d2617"))
		name_label.add_theme_constant_override("outline_size", 3)
		walker.add_child(name_label)

	parent.add_child(walker)
	walkers.append(walker)
	_try_apply_remote_avatar(sprite, avatar_url)


func _update_walker(walker: Node2D, delta: float) -> void:
	var target: Vector2 = walker.get_meta("target")
	var speed: float = walker.get_meta("speed")
	var direction := target - walker.position

	if direction.length() < 5.0:
		walker.set_meta("target", _random_walk_position())
		return

	var next_position := walker.position + direction.normalized() * speed * delta
	if _is_point_blocked(next_position):
		walker.set_meta("target", _random_walk_position())
		return

	walker.position = next_position
	walker.z_index = int(walker.position.y)

	var sprite := walker.get_node("Sprite2D") as Sprite2D
	sprite.flip_h = direction.x < 0.0
	var bob_phase: float = walker.get_meta("bob_phase")
	sprite.position.y = sin(Time.get_ticks_msec() / 180.0 + bob_phase) * 2.0


func _on_entity_input(_viewport: Node, event: InputEvent, _shape_idx: int, area: Area2D) -> void:
	if not (event is InputEventMouseButton):
		return

	var mouse_event := event as InputEventMouseButton
	if not (mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed):
		return

	var feature := str(area.get_meta("feature"))
	if feature == "chief_house":
		_post_message("MONGLE_CHIEF_HOUSE_CLICKED", {})
		return

	if feature == "resident_house":
		var owner_name := str(area.get_meta("owner_name"))
		var bounds: Rect2 = area.get_meta("bounds")
		_focus_house(owner_name, bounds.get_center())
		_post_message("MONGLE_RESIDENT_HOUSE_CLICKED", {"ownerName": owner_name})


func _focus_house(owner_name: String, focus_position: Vector2) -> void:
	if is_instance_valid(info_tween):
		info_tween.kill()

	info_label.text = "%s의 집" % owner_name
	info_label.position = focus_position + Vector2(-58, -96)
	info_label.visible = true

	info_tween = create_tween()
	info_tween.set_parallel(true)
	info_tween.tween_property(camera, "position", focus_position, 0.28).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	info_tween.tween_property(camera, "zoom", Vector2(1.16, 1.16), 0.28).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	info_tween.set_parallel(false)
	info_tween.tween_interval(1.6)
	info_tween.set_parallel(true)
	info_tween.tween_property(camera, "position", VIEWPORT_SIZE / 2.0, 0.35).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	info_tween.tween_property(camera, "zoom", Vector2.ONE, 0.35).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	info_tween.set_parallel(false)
	info_tween.tween_callback(func() -> void: info_label.visible = false)


func _add_info_label() -> void:
	info_label = Label.new()
	info_label.name = "HouseInfoLabel"
	info_label.size = Vector2(116, 32)
	info_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	info_label.visible = false
	info_label.z_index = 2000
	info_label.add_theme_font_override("font", KOREAN_FONT)
	info_label.add_theme_font_size_override("font_size", 22)
	info_label.add_theme_color_override("font_color", Color("#fff5c7"))
	info_label.add_theme_color_override("font_outline_color", Color("#3b2719"))
	info_label.add_theme_constant_override("outline_size", 5)
	add_child(info_label)


func _resident_names() -> Array[String]:
	var names: Array[String] = []

	if OS.has_feature("web"):
		var raw_names: Variant = JavaScriptBridge.eval("new URLSearchParams(window.location.search).get('names') || '';", true)
		for raw_name in str(raw_names).split("|", false):
			var trimmed := raw_name.strip_edges()
			if trimmed != "":
				names.append(trimmed)

	if names.size() > MAX_RESIDENTS:
		names.resize(MAX_RESIDENTS)

	return names


func _resident_avatars() -> Array[String]:
	var avatars: Array[String] = []

	if OS.has_feature("web"):
		var raw_avatars: Variant = JavaScriptBridge.eval("new URLSearchParams(window.location.search).get('avatars') || '[]';", true)
		var parsed = JSON.parse_string(str(raw_avatars))
		if parsed is Array:
			for item in parsed:
				avatars.append(str(item))

	if avatars.size() > MAX_RESIDENTS:
		avatars.resize(MAX_RESIDENTS)

	return avatars


func _house_slots() -> Array[Rect2]:
	var points := [
		Vector2(248, 92),
		Vector2(430, 92),
		Vector2(612, 92),
		Vector2(248, 236),
		Vector2(760, 236),
		Vector2(248, 374),
		Vector2(430, 374),
		Vector2(612, 374),
		Vector2(760, 374),
	]
	var slots: Array[Rect2] = []
	for point in points:
		slots.append(Rect2(point, RESIDENT_HOUSE_SIZE))
	return slots


func _is_slot_clear(rect: Rect2) -> bool:
	for blocked_rect in _hud_block_rects():
		if rect.grow(HOUSE_GAP).intersects(blocked_rect):
			return false

	for occupied in occupied_rects:
		if rect.grow(HOUSE_GAP).intersects(occupied):
			return false

	return true


func _is_point_blocked(point: Vector2) -> bool:
	if not walk_bounds.has_point(point):
		return true

	for blocked_rect in _hud_block_rects():
		if blocked_rect.has_point(point):
			return true

	for occupied in occupied_rects:
		if occupied.has_point(point):
			return true

	return false


func _hud_block_rects() -> Array[Rect2]:
	return [
		Rect2(Vector2(0, 0), Vector2(1280, 78)),
		Rect2(Vector2(0, 78), Vector2(232, 430)),
		Rect2(Vector2(938, 78), Vector2(342, 432)),
		Rect2(Vector2(0, 508), Vector2(1280, 212)),
	]


func _safe_start_near_house(house_rect: Rect2) -> Vector2:
	var candidates := [
		house_rect.get_center() + Vector2(0, house_rect.size.y * 0.85),
		house_rect.get_center() + Vector2(house_rect.size.x * 0.82, 22),
		house_rect.get_center() + Vector2(-house_rect.size.x * 0.82, 22),
	]
	for candidate in candidates:
		if not _is_point_blocked(candidate):
			return candidate
	return _random_walk_position()


func _safe_walk_position(candidate_position: Vector2) -> Vector2:
	if not _is_point_blocked(candidate_position):
		return candidate_position
	return _random_walk_position()


func _random_walk_position() -> Vector2:
	for _attempt in range(80):
		var candidate := Vector2(
			rng.randf_range(walk_bounds.position.x, walk_bounds.end.x),
			rng.randf_range(walk_bounds.position.y, walk_bounds.end.y)
		)
		if not _is_point_blocked(candidate):
			return candidate
	return walk_bounds.get_center()


func _fit_texture_scale(texture: Texture2D, target_size: Vector2) -> Vector2:
	var scale_ratio := minf(target_size.x / texture.get_width(), target_size.y / texture.get_height())
	return Vector2.ONE * scale_ratio




func _resident_tint(resident_name: String) -> Color:
	var hue := float(abs(hash(resident_name)) % 360) / 360.0
	return Color.from_hsv(hue, 0.18, 1.0, 1.0)


func _try_apply_remote_avatar(sprite: Sprite2D, avatar_url: String) -> void:
	var trimmed := avatar_url.strip_edges()
	if trimmed == "":
		return

	if trimmed.begins_with("data:"):
		_apply_data_avatar(sprite, trimmed)
		return

	var resolved_url := _resolve_avatar_url(trimmed)
	if resolved_url == "":
		return

	var req := HTTPRequest.new()
	req.request_completed.connect(_on_avatar_download_completed.bind(sprite, resolved_url, req))
	add_child(req)
	var request_err := req.request(resolved_url)
	if request_err != OK:
		req.queue_free()


func _resolve_avatar_url(url: String) -> String:
	if url.begins_with("http://") or url.begins_with("https://"):
		return url
	if url.begins_with("data:"):
		return url
	if url.begins_with("/generated/"):
		if OS.has_feature("web"):
			var origin: Variant = JavaScriptBridge.eval(
				"window.location.protocol + '//' + window.location.hostname + ':8010';",
				true
			)
			return str(origin) + url
	if url.begins_with("/"):
		if OS.has_feature("web"):
			var app_origin: Variant = JavaScriptBridge.eval("window.location.origin;", true)
			return str(app_origin) + url
	return ""


func _apply_data_avatar(sprite: Sprite2D, data_url: String) -> void:
	var comma_index := data_url.find(",")
	if comma_index < 0:
		return

	var meta := data_url.substr(5, comma_index - 5)
	var encoded := data_url.substr(comma_index + 1)
	var body := Marshalls.base64_to_raw(encoded)
	if body.is_empty():
		return

	var image := Image.new()
	var load_err := ERR_FILE_UNRECOGNIZED
	if meta.find("image/png") >= 0:
		load_err = image.load_png_from_buffer(body)
	elif meta.find("image/jpeg") >= 0 or meta.find("image/jpg") >= 0:
		load_err = image.load_jpg_from_buffer(body)
	elif meta.find("image/webp") >= 0:
		load_err = image.load_webp_from_buffer(body)
	if load_err != OK:
		return

	var texture := ImageTexture.create_from_image(image)
	if texture == null:
		return

	sprite.texture = texture
	var scale_size := float(sprite.get_meta("scale_size", 0.16))
	var longest_side := maxf(texture.get_width(), texture.get_height())
	sprite.scale = Vector2.ONE * ((VIEWPORT_SIZE.y * scale_size) / longest_side)


func _on_avatar_download_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray, sprite: Sprite2D, request_url: String, req: HTTPRequest) -> void:
	req.queue_free()
	if result != HTTPRequest.RESULT_SUCCESS:
		return
	if response_code < 200 or response_code >= 300:
		return

	var content_type := ""
	for header in headers:
		var lower := header.to_lower()
		if lower.begins_with("content-type:"):
			content_type = lower.split(":", false, 1)[1].strip_edges()
			break

	var image := Image.new()
	var load_err := ERR_FILE_UNRECOGNIZED
	if content_type.find("image/png") >= 0 or request_url.ends_with(".png"):
		load_err = image.load_png_from_buffer(body)
	elif content_type.find("image/jpeg") >= 0 or content_type.find("image/jpg") >= 0 or request_url.ends_with(".jpg") or request_url.ends_with(".jpeg"):
		load_err = image.load_jpg_from_buffer(body)
	elif content_type.find("image/webp") >= 0 or request_url.ends_with(".webp"):
		load_err = image.load_webp_from_buffer(body)
	if load_err != OK:
		return

	var texture := ImageTexture.create_from_image(image)
	if texture == null:
		return

	sprite.texture = texture
	var scale_size := float(sprite.get_meta("scale_size", 0.16))
	var longest_side := maxf(texture.get_width(), texture.get_height())
	sprite.scale = Vector2.ONE * ((VIEWPORT_SIZE.y * scale_size) / longest_side)


func _post_message(message_type: String, payload: Dictionary) -> void:
	if not OS.has_feature("web"):
		return

	var payload_json := JSON.stringify(payload)
	var script := "window.parent.postMessage({ type: %s, payload: %s }, window.location.origin);" % [
		JSON.stringify(message_type),
		payload_json,
	]
	JavaScriptBridge.eval(script, true)
