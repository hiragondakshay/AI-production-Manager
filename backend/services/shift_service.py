from datetime import datetime, time, timedelta
import zoneinfo
import os

# Factory Timezone Configuration (Defaults to Asia/Kolkata / IST, or system environment)
FACTORY_TIMEZONE_NAME = os.getenv("FACTORY_TIMEZONE", "Asia/Kolkata")

try:
    FACTORY_TZ = zoneinfo.ZoneInfo(FACTORY_TIMEZONE_NAME)
except Exception:
    FACTORY_TZ = None

# Default Configurable Shift Schedule
# Morning: 06:00 AM - 02:00 PM (06:00 - 14:00)
# Evening: 02:00 PM - 10:00 PM (14:00 - 22:00)
# Night:   10:00 PM - 06:00 AM (22:00 - 06:00 next day)
DEFAULT_SHIFT_SCHEDULE = [
    {
        "code": "morning",
        "name": "Morning Shift",
        "start_time": "06:00",
        "end_time": "14:00",
        "formatted_range": "06:00 AM – 02:00 PM",
        "color": "#38BDF8",
        "description": "Primary day production & heavy machining operations"
    },
    {
        "code": "evening",
        "name": "Evening Shift",
        "start_time": "14:00",
        "end_time": "22:00",
        "formatted_range": "02:00 PM – 10:00 PM",
        "color": "#F59E0B",
        "description": "Secondary assembly, inspection & continuous batching"
    },
    {
        "code": "night",
        "name": "Night Shift",
        "start_time": "22:00",
        "end_time": "06:00",
        "formatted_range": "10:00 PM – 06:00 AM (Next Day)",
        "color": "#A855F7",
        "description": "Automated lights-out CNC runs & overnight thermal soak"
    }
]

shift_config_store = list(DEFAULT_SHIFT_SCHEDULE)

def get_factory_now():
    """Returns the current factory time in the configured factory timezone"""
    if FACTORY_TZ:
        return datetime.now(FACTORY_TZ)
    return datetime.now()

def parse_time_str(time_str: str) -> time:
    parts = time_str.split(":")
    return time(int(parts[0]), int(parts[1]))

def get_current_factory_shift(dt: datetime = None) -> dict:
    """
    Evaluates current active shift with boundary detection, countdown to next shift,
    and progress percentage. Handles midnight rollover accurately for Night Shift.
    """
    now = dt if dt else get_factory_now()
    current_time = now.time()
    current_date = now.date()

    # Time boundaries in minutes from midnight for exact precision
    current_minutes = current_time.hour * 60 + current_time.minute + (current_time.second / 60.0)

    # 06:00 = 360 mins, 14:00 = 840 mins, 22:00 = 1320 mins
    # Morning: 06:00 <= t < 14:00 (360 <= mins < 840)
    # Evening: 14:00 <= t < 22:00 (840 <= mins < 1320)
    # Night:   22:00 <= t < 24:00 OR 00:00 <= t < 06:00 (mins >= 1320 OR mins < 360)

    if 360 <= current_minutes < 840:
        active_shift = shift_config_store[0] # Morning
        next_shift = shift_config_store[1]   # Evening
        shift_start_dt = datetime.combine(current_date, time(6, 0), tzinfo=now.tzinfo)
        shift_end_dt = datetime.combine(current_date, time(14, 0), tzinfo=now.tzinfo)
        next_shift_start_dt = shift_end_dt
    elif 840 <= current_minutes < 1320:
        active_shift = shift_config_store[1] # Evening
        next_shift = shift_config_store[2]   # Night
        shift_start_dt = datetime.combine(current_date, time(14, 0), tzinfo=now.tzinfo)
        shift_end_dt = datetime.combine(current_date, time(22, 0), tzinfo=now.tzinfo)
        next_shift_start_dt = shift_end_dt
    else:
        active_shift = shift_config_store[2] # Night
        next_shift = shift_config_store[0]   # Morning
        if current_minutes >= 1320: # 22:00 to 23:59:59
            shift_start_dt = datetime.combine(current_date, time(22, 0), tzinfo=now.tzinfo)
            shift_end_dt = datetime.combine(current_date + timedelta(days=1), time(6, 0), tzinfo=now.tzinfo)
            next_shift_start_dt = shift_end_dt
        else: # 00:00 to 05:59:59
            shift_start_dt = datetime.combine(current_date - timedelta(days=1), time(22, 0), tzinfo=now.tzinfo)
            shift_end_dt = datetime.combine(current_date, time(6, 0), tzinfo=now.tzinfo)
            next_shift_start_dt = shift_end_dt

    # Exact seconds remaining until next shift
    total_shift_seconds = (shift_end_dt - shift_start_dt).total_seconds()
    elapsed_seconds = max(0, (now - shift_start_dt).total_seconds())
    seconds_remaining = max(0, int((next_shift_start_dt - now).total_seconds()))

    hours_rem = seconds_remaining // 3600
    mins_rem = (seconds_remaining % 3600) // 60
    secs_rem = seconds_remaining % 60
    countdown_formatted = f"{hours_rem:02d}:{mins_rem:02d}:{secs_rem:02d}"

    progress_percentage = min(100.0, max(0.0, round((elapsed_seconds / max(1.0, total_shift_seconds)) * 100, 1)))

    return {
        "active_shift": {
            "code": active_shift["code"],
            "name": active_shift["name"],
            "start_time": active_shift["start_time"],
            "end_time": active_shift["end_time"],
            "formatted_range": active_shift["formatted_range"],
            "color": active_shift["color"],
            "description": active_shift["description"],
            "shift_start_timestamp": shift_start_dt.isoformat(),
            "shift_end_timestamp": shift_end_dt.isoformat(),
            "progress_percentage": progress_percentage
        },
        "next_shift": {
            "code": next_shift["code"],
            "name": next_shift["name"],
            "start_time": next_shift["start_time"],
            "end_time": next_shift["end_time"],
            "formatted_range": next_shift["formatted_range"],
            "starts_at_timestamp": next_shift_start_dt.isoformat(),
            "seconds_remaining": seconds_remaining,
            "countdown_formatted": countdown_formatted,
            "countdown_message": f"Next shift ({next_shift['name']}) starts in {countdown_formatted}"
        },
        "factory_context": {
            "timezone": FACTORY_TIMEZONE_NAME,
            "current_time": now.strftime("%I:%M:%S %p"),
            "current_date": now.strftime("%Y-%m-%d"),
            "day_of_week": now.strftime("%A")
        },
        "all_shifts": shift_config_store
    }

def get_shift_for_timestamp(dt: datetime) -> str:
    """Returns the shift name associated with any past or future timestamp"""
    res = get_current_factory_shift(dt)
    return res["active_shift"]["name"]
