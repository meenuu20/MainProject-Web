import cv2
import numpy as np
import onnxruntime as ort
import time
import os
import requests
from contextlib import ExitStack
from collections import deque

# ===================== THE EPIPHANY RESTORATION (2:41 PM SUCCESS) =====================
# This version uses two specialized brains: yolov8n for Person, last.onnx for Trash.
# It was found to be the most stable configuration for illegal dumping detection.

session_p = ort.InferenceSession("yolov8n.onnx", providers=["CPUExecutionProvider"])
input_p = session_p.get_inputs()[0].name

session_g = ort.InferenceSession("last.onnx", providers=["CPUExecutionProvider"])
input_g = session_g.get_inputs()[0].name

MODEL_W, MODEL_H = 320, 320

# ---- SENSITIVITY (THE "PERFECT" TUNING) ----
CONF_PERSON   = 0.55   # HIGH threshold to eliminate "chair/ghost" person boxes
CONF_GARBAGE  = 0.30   # LOWERED for higher sensitivity
IOU_THRESHOLD = 0.45

PERSON_GONE_SECONDS   = 3.0   # Must be absent 3s to trigger dump
STATIONARY_SECONDS    = 2.0   # Must be still for 2s to be "placed"
CARRY_CONFIRM_SECONDS = 0.4   # Must move with person for 0.4s to be "carried"
MOVEMENT_THRESHOLD    = 4     # Pixel movement for delta check
PERSON_NEAR_DIST      = 450   # Max distance to consider "on person"

# ---- VIDEO RECORDING SETTINGS ----
PRE_EVENT_SECONDS = 5.0   # "Memory" before the alert pops (Captures YOU)
VIDEO_FPS         = 20.0  # Assumed camera FPS
pre_event_buffer  = deque(maxlen=int(VIDEO_FPS * PRE_EVENT_SECONDS))
API_ENDPOINT      = os.getenv("EVIDENCE_API_ENDPOINT", "https://dumping-evidence-backend-production-296d.up.railway.app/api/evidence")
VIDEO_CODECS      = [("avc1", ".mp4", "video/mp4"), ("mp4v", ".mp4", "video/mp4"), ("MJPG", ".avi", "video/x-msvideo")]
os.makedirs("evidence/images", exist_ok=True)
os.makedirs("evidence/videos", exist_ok=True)

# ===================== UTILS =====================
def preprocess(frame):
    img = cv2.resize(frame, (MODEL_W, MODEL_H))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    return np.expand_dims(np.transpose(img, (2, 0, 1)), axis=0)

def nms(boxes, scores, threshold):
    if len(boxes) == 0: return []
    x1, y1, x2, y2 = boxes[:,0], boxes[:,1], boxes[:,2], boxes[:,3]
    areas, order, keep = (x2-x1)*(y2-y1), scores.argsort()[::-1], []
    while order.size > 0:
        i = order[0]; keep.append(i)
        xx1, yy1 = np.maximum(x1[i], x1[order[1:]]), np.maximum(y1[i], y1[order[1:]])
        xx2, yy2 = np.minimum(x2[i], x2[order[1:]]), np.minimum(y2[i], y2[order[1:]])
        inter = np.maximum(0, xx2-xx1) * np.maximum(0, yy2-yy1)
        iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)
        order = order[np.where(iou <= threshold)[0] + 1]
    return keep

def postprocess_dual(outputs_p, outputs_g, orig_w, orig_h):
    results = []
    sx, sy = orig_w/MODEL_W, orig_h/MODEL_H
    
    # 1. Process Person (yolov8n - Class 0)
    pred_p = outputs_p[0]
    if pred_p.ndim == 3: pred_p = pred_p.transpose(0, 2, 1)[0] if pred_p.shape[1] < pred_p.shape[2] else pred_p[0]
    cids_p, confs_p = np.argmax(pred_p[:,4:], axis=1), np.max(pred_p[:,4:], axis=1)
    
    for i in range(len(pred_p)):
        if cids_p[i] == 0 and confs_p[i] >= CONF_PERSON:
            cx, cy, bw, bh = pred_p[i, :4]
            x1, y1, x2, y2 = int((cx-bw/2)*sx), int((cy-bh/2)*sy), int((cx+bw/2)*sx), int((cy+bh/2)*sy)
            results.append({"box": np.array([x1,y1,x2,y2]), "conf": float(confs_p[i]), "class": "person"})

    # 2. Process Trash (last.onnx - Class 0,1,3)
    pred_g = outputs_g[0]
    if pred_g.ndim == 3: pred_g = pred_g.transpose(0, 2, 1)[0] if pred_g.shape[1] < pred_g.shape[2] else pred_g[0]
    cids_g, confs_g = np.argmax(pred_g[:,4:], axis=1), np.max(pred_g[:,4:], axis=1)
    
    for i in range(len(pred_g)):
        if cids_g[i] in [0, 1, 3] and confs_g[i] >= CONF_GARBAGE:
            cx, cy, bw, bh = pred_g[i, :4]
            x1, y1, x2, y2 = int((cx-bw/2)*sx), int((cy-bh/2)*sy), int((cx+bw/2)*sx), int((cy+bh/2)*sy)
            results.append({"box": np.array([x1,y1,x2,y2]), "conf": float(confs_g[i]), "class": "garbage"})

    if not results: return []
    
    # 3. GLOBAL NMS (Unified Coordinate Space)
    boxes = np.array([r["box"] for r in results])
    scores = np.array([r["conf"] for r in results])
    keep = nms(boxes, scores, IOU_THRESHOLD)
    return [results[i] for i in keep]

def create_video_writer(base_path_without_ext, fps, frame_size):
    for codec, extension, mime_type in VIDEO_CODECS:
        video_path = f"{base_path_without_ext}{extension}"
        fourcc = cv2.VideoWriter_fourcc(*codec)
        writer = cv2.VideoWriter(video_path, fourcc, fps, frame_size)
        if writer.isOpened():
            print(f"Started recording video: {video_path} using codec {codec}")
            return writer, video_path, mime_type
        writer.release()
    print("Failed to open video writer for all configured codecs")
    return None, None, None

class SimpleTracker:
    def __init__(self, max_dist=200, max_lost=30):
        self.next_id, self.tracks, self.max_dist, self.max_lost = 0, {}, max_dist, max_lost
    def update(self, detections):
        updated, used_det = {}, set()
        for tid, track in self.tracks.items():
            best_dist, best_idx = self.max_dist, -1
            for i, d in enumerate(detections):
                if i in used_det: continue
                dist = np.linalg.norm(np.array([(d["box"][0]+d["box"][2])//2, (d["box"][1]+d["box"][3])//2]) - np.array(track["center"]))
                if dist < best_dist: best_dist, best_idx = dist, i
            if best_idx >= 0:
                det = detections[best_idx]
                updated[tid] = {"center": ((det["box"][0]+det["box"][2])//2, (det["box"][1]+det["box"][3])//2), "box": det["box"], "class": det["class"], "conf": det["conf"], "lost": 0}
                used_det.add(best_idx)
            else:
                track["lost"] = track.get("lost",0) + 1
                if track["lost"] < self.max_lost: updated[tid] = track
        for i, d in enumerate(detections):
            if i not in used_det:
                updated[self.next_id] = {"center": ((d["box"][0]+d["box"][2])//2, (d["box"][1]+d["box"][3])//2), "box": d["box"], "class": d["class"], "conf": d["conf"], "lost": 0}
                self.next_id += 1
        self.tracks = updated
        return updated

# ===================== MEMORY =====================
tracker = SimpleTracker()
garbage_state, garbage_positions, garbage_reported, garbage_was_carried = {}, {}, {}, {}
garbage_stationary_time, garbage_carry_start_time, last_person_time = {}, {}, time.time()

recording, video_writer = False, None
latest_person_garbage_frame = None
pending_upload = None

def upload_pending_evidence():
    global pending_upload
    if not pending_upload:
        return
    try:
        with ExitStack() as stack:
            video_file = stack.enter_context(open(pending_upload["video_path"], "rb"))
            files = {
                "video": (os.path.basename(pending_upload["video_path"]), video_file, pending_upload["video_mime"]),
            }
            image_path = pending_upload.get("image_path")
            if image_path:
                image_file = stack.enter_context(open(image_path, "rb"))
                files["image"] = (os.path.basename(image_path), image_file, "image/jpeg")
            data = {
                "timestamp": pending_upload["timestamp"],
                "camera_id": pending_upload["camera_id"],
                "location": pending_upload["location"],
                "confidence": pending_upload["confidence"],
                "details": pending_upload["details"],
            }
            response = requests.post(API_ENDPOINT, files=files, data=data, timeout=15)
            response.raise_for_status()
        print(f"[API] Uploaded image and video evidence to {API_ENDPOINT}")
    except Exception as e:
        print(f"[API] Failed to upload evidence: {e}")
    finally:
        pending_upload = None

def start_recording_event(orig_w, orig_h, garbage_id, garbage_conf):
    global recording, video_writer, pending_upload
    if recording:
        return
    ts = time.strftime("%Y%m%d_%H%M%S")
    video_writer, video_path, video_mime = create_video_writer(
        f"evidence/videos/dump_{ts}",
        VIDEO_FPS,
        (orig_w, orig_h),
    )
    if video_writer is None:
        return

    for buf_frame in pre_event_buffer:
        video_writer.write(buf_frame)

    recording = True
    pending_upload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "camera_id": "CAM-01",
        "location": "Main View",
        "confidence": garbage_conf,
        "details": f'{{"garbage_id": {garbage_id}, "reason": "dumped"}}',
        "image_path": None,
        "video_path": video_path,
        "video_mime": video_mime,
    }
    print(f"[VIDEO] Recording started for garbage {garbage_id}")

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640); cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("EPIPHANY RESTORED: Stable Dual-Model System Running.")

while True:
    ret, frame = cap.read()
    if not ret: break
    orig_h, orig_w, current_time, annotated = frame.shape[0], frame.shape[1], time.time(), frame.copy()
    
    blob = preprocess(frame)
    out_p = session_p.run(None, {input_p: blob})
    out_g = session_g.run(None, {input_g: blob})
    
    detections = postprocess_dual(out_p, out_g, orig_w, orig_h)
    tracks = tracker.update(detections)
    
    # 1. Map all persons FIRST for the suppression filter
    persons_boxes = []
    for tid, track in tracks.items():
        if track.get("lost",0) == 0 and track["class"] == "person":
            persons_boxes.append(track["box"])

    persons, garbages = {}, {}
    for tid, track in tracks.items():
        if track.get("lost",0) > 0: continue
        x1, y1, x2, y2 = track["box"]; cx, cy = track["center"]; cn = track["class"]
        
        if cn == "person": 
            persons[tid] = track["center"]
        else:
            # --- CLOTHES SUPPRESSION FILTER ---
            # If this is a new detection of garbage (State unknown or new ID)
            # and it is logically "on" a person, assume it is clothes and skip.
            is_clothes = False
            if garbage_state.get(tid, 0) == 0: # Unknown state
                for pb in persons_boxes:
                    if pb[0] < cx < pb[2] and pb[1] < cy < pb[3]:
                        is_clothes = True
                        break
            
            if is_clothes: continue
            garbages[tid] = {"center": track["center"], "conf": track["conf"]}

        # Only draw logic for things that passed the filter
        color = (0, 255, 0) if cn == "person" else (0, 165, 255)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2.putText(annotated, f"{cn} {tid} {track['conf']:.2f}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    if persons: last_person_time = current_time
    person_absent_seconds = current_time - last_person_time

    for g_id, garbage_info in garbages.items():
        g_center = garbage_info["center"]
        if g_id not in garbage_state:
            garbage_state[g_id], garbage_reported[g_id], garbage_was_carried[g_id] = 0, False, False
        
        movement = np.linalg.norm(np.array(g_center) - np.array(garbage_positions.get(g_id, g_center)))
        garbage_positions[g_id] = g_center
        state = garbage_state[g_id]
        person_near = any(np.linalg.norm(np.array(p) - np.array(g_center)) < PERSON_NEAR_DIST for p in persons.values())
        
        # HUD for Garbage State
        state_labels = ["unknown", "carried", "placed", "DUMPED"]
        state_color = (128, 128, 128) if state == 0 else (0, 255, 255) # Gray for unknown, Cyan for active
        cv2.putText(annotated, f"[{state_labels[state]}]", (int(g_center[0]), int(g_center[1])+20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, state_color, 1)

        # ===================== STATE MACHINE =====================
        # --- STATE 0: Unknown ---
        if state == 0:
            if person_near and movement > MOVEMENT_THRESHOLD:
                garbage_carry_start_time[g_id] = garbage_carry_start_time.get(g_id, current_time)
                if current_time - garbage_carry_start_time[g_id] > CARRY_CONFIRM_SECONDS:
                    garbage_state[g_id], garbage_was_carried[g_id] = 1, True
                    garbage_stationary_time.pop(g_id, None)
                    print(f"[STATE] Garbage {g_id} -> CARRIED")
            elif movement < MOVEMENT_THRESHOLD and garbage_was_carried[g_id]:
                if g_id not in garbage_stationary_time: garbage_stationary_time[g_id] = current_time
                if current_time - garbage_stationary_time[g_id] > STATIONARY_SECONDS:
                    garbage_state[g_id] = 2
                    garbage_carry_start_time.pop(g_id, None)
                    print(f"[STATE] Garbage {g_id} -> PLACED")
                    start_recording_event(orig_w, orig_h, g_id, garbage_info["conf"])
            else:
                garbage_carry_start_time.pop(g_id, None)
                garbage_stationary_time.pop(g_id, None)

        # --- STATE 1: Carried ---
        elif state == 1:
            if movement < MOVEMENT_THRESHOLD:
                if g_id not in garbage_stationary_time: garbage_stationary_time[g_id] = current_time
                if current_time - garbage_stationary_time[g_id] > STATIONARY_SECONDS:
                    garbage_state[g_id] = 2
                    print(f"[STATE] Garbage {g_id} -> PLACED")
                    start_recording_event(orig_w, orig_h, g_id, garbage_info["conf"])
            else:
                garbage_stationary_time.pop(g_id, None)

        # --- STATE 2: Placed - check for dumping ---
        elif state == 2:
            # Transition back to CARRIED if picked up again
            if person_near and movement > MOVEMENT_THRESHOLD:
                garbage_state[g_id] = 1
                garbage_stationary_time.pop(g_id, None)
                print(f"[STATE] Garbage {g_id} -> RE-CARRIED")
            else:
                rem = max(0, PERSON_GONE_SECONDS - person_absent_seconds)
                if person_near and persons:
                    latest_person_garbage_frame = frame.copy()
                if not persons:
                    cv2.putText(annotated, f"DUMP in {rem:.1f}s", (int(g_center[0])-30, int(g_center[1])+40), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 100, 255), 1)
                
                if person_absent_seconds >= PERSON_GONE_SECONDS and not garbage_reported[g_id]:
                    garbage_state[g_id], garbage_reported[g_id] = 3, True
                    print("!! DUMPING DETECTED !!")
                    if not recording:
                        start_recording_event(orig_w, orig_h, g_id, garbage_info["conf"])
                    image_path = pending_upload["video_path"].replace("/videos/", "/images/").replace("\\videos\\", "\\images\\")
                    image_path = os.path.splitext(image_path)[0] + ".jpg"
                    evidence_frame = latest_person_garbage_frame if latest_person_garbage_frame is not None else frame.copy()
                    cv2.imwrite(image_path, evidence_frame)
                    if pending_upload is not None:
                        pending_upload["image_path"] = image_path
                    latest_person_garbage_frame = None
                    
        # --- HUD ALERT: DUMPING DETECTED ---
        if any(garbage_state[gid] == 3 for gid in garbage_state):
             cv2.putText(annotated, "!! DUMPING DETECTED !!", (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 4)

    # Continuously "Remember" the last 5 seconds for Culprit Capture
    pre_event_buffer.append(frame.copy())

    # Video Recording logic
    if recording:
        video_writer.write(frame)
        if person_absent_seconds >= PERSON_GONE_SECONDS and pending_upload is not None:
            recording = False
            video_writer.release()
            video_writer = None
            print("Video saved after person left")
            upload_pending_evidence()

    cv2.putText(annotated, "STABLE DUAL-MODEL RESTORED", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.imshow("Dumping Detection", annotated)
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
if recording:
    video_writer.release()
    video_writer = None
    upload_pending_evidence()
cv2.destroyAllWindows()
