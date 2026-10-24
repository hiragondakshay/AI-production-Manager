import urllib.request
import json
import sys

BASE = 'http://127.0.0.1:8000'

def req(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data_bytes = json.dumps(data).encode('utf-8') if data else None
    req_obj = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req_obj) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as ex:
        return 500, str(ex)

print("=== 1. Testing System Root ===")
status, body = req(f'{BASE}/')
print(f"Root endpoint: {status} -> {body.get('status') if isinstance(body, dict) else body}")

print("\n=== 2. Testing Role Authentication ===")
roles = [
    ('plant_mgr', 'manager123'),
    ('prod_mgr', 'prod123'),
    ('maint_mgr', 'maint123'),
    ('quality_mgr', 'quality123'),
    ('operator_1', 'operator123')
]

token = None
for u, p in roles:
    st, res = req(f'{BASE}/api/auth/login', 'POST', {'username': u, 'password': p})
    role_name = res.get('user', {}).get('role') if isinstance(res, dict) else 'FAILED'
    print(f"Login '{u}': status={st}, role={role_name}")
    if u == 'plant_mgr' and isinstance(res, dict):
        token = res.get('access_token')

print("\n=== 3. Testing 16 Enterprise Endpoints ===")
endpoints = [
    ('/api/smart-factory/command-center', 'GET', None),
    ('/api/smart-factory/machines/1', 'GET', None),
    ('/api/ai/predictive-maintenance', 'GET', None),
    ('/api/enterprise/oee/analytics', 'GET', None),
    ('/api/enterprise/downtime/analytics', 'GET', None),
    ('/api/enterprise/work-orders', 'GET', None),
    ('/api/enterprise/inventory/smart-reorder', 'GET', None),
    ('/api/enterprise/energy/monitoring', 'GET', None),
    ('/api/enterprise/costs/orders', 'GET', None),
    ('/api/enterprise/operators/performance', 'GET', None),
    ('/api/enterprise/audit-logs', 'GET', None),
    ('/api/enterprise/notifications', 'GET', None),
    ('/api/ai/forecast', 'POST', {'days': 14}),
    ('/api/enterprise/simulation/run', 'POST', {'scenario_type': 'machine_failure', 'machine_id': 1, 'downtime_hours': 4.0, 'demand_surge_pct': 25.0}),
    ('/api/enterprise/copilot/ask', 'POST', {'query': 'What is the current health of CNC Alpha?'}),
    ('/api/smart-factory/machines/1/digital-twin', 'GET', None),
    ('/api/enterprise/shifts/current', 'GET', None),
    ('/api/enterprise/shifts/schedule', 'GET', None)
]

all_passed = True
for ep, method, payload in endpoints:
    st, res = req(f'{BASE}{ep}', method, payload, token)
    status_tag = "PASS" if st == 200 else "FAIL"
    print(f"[{status_tag}] {method} {ep} -> Status {st}")
    if st != 200:
        all_passed = False

print("\n=== Summary ===")
print("All enterprise endpoints verified successfully!" if all_passed else "Some endpoints failed.")
