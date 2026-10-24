import urllib.request
import json

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("=== 1. Testing Valid Logins for All 5 Demo Accounts ===")
for u, p, expected_role in [
    ('plant_mgr', 'manager123', 'plant_manager'),
    ('prod_mgr', 'prod123', 'production_manager'),
    ('maint_mgr', 'maint123', 'maintenance_manager'),
    ('quality_mgr', 'quality123', 'quality_manager'),
    ('operator_1', 'operator123', 'operator'),
]:
    code, res = post_json('http://localhost:8000/api/auth/login', {'username': u, 'password': p})
    role = res.get('user', {}).get('role')
    status = "PASS" if code == 200 and role == expected_role else "FAIL"
    print(f"User: {u} -> Status: {code}, Role: {role} (Expected: {expected_role}) - [{status}]")

print("\n=== 2. Testing Invalid Password ===")
code, res = post_json('http://localhost:8000/api/auth/login', {'username': 'plant_mgr', 'password': 'wrong_password_123'})
status = "PASS" if code == 400 else "FAIL"
print(f"Status: {code}, Detail: {res.get('detail')} - [{status}]")

print("\n=== 3. Testing Non-Existent User ===")
code, res = post_json('http://localhost:8000/api/auth/login', {'username': 'unknown_user_99', 'password': 'some_password'})
status = "PASS" if code == 400 else "FAIL"
print(f"Status: {code}, Detail: {res.get('detail')} - [{status}]")

print("\n=== 4. Testing Forgot Password - Valid Username ===")
code, res = post_json('http://localhost:8000/api/auth/forgot-password', {'username_or_email': 'plant_mgr'})
status = "PASS" if code == 200 and res.get('success') else "FAIL"
print(f"Status: {code}, Msg: {res.get('message')} - [{status}]")

print("\n=== 5. Testing Forgot Password - Valid Email ===")
code, res = post_json('http://localhost:8000/api/auth/forgot-password', {'username_or_email': 'production.manager@factory.com'})
status = "PASS" if code == 200 and res.get('success') else "FAIL"
print(f"Status: {code}, Msg: {res.get('message')} - [{status}]")

print("\n=== 6. Testing Forgot Password - Non-Existent Account ===")
code, res = post_json('http://localhost:8000/api/auth/forgot-password', {'username_or_email': 'nonexistent@nowhere.com'})
status = "PASS" if code == 404 else "FAIL"
print(f"Status: {code}, Detail: {res.get('detail')} - [{status}]")

print("\n=== 7. Testing Forgot Password - Empty Input ===")
code, res = post_json('http://localhost:8000/api/auth/forgot-password', {'username_or_email': '   '})
status = "PASS" if code == 400 else "FAIL"
print(f"Status: {code}, Detail: {res.get('detail')} - [{status}]")
