import json
from fastapi.testclient import TestClient
from app import app

c = TestClient(app)

print("== GET / ==")
print(c.get("/").json())

print("\n== GET /api/product-overview ==")
r = c.get("/api/product-overview")
print("status:", r.status_code)
print(json.dumps(r.json(), indent=2, default=str))

print("\n== GET /api/metric/p8_clinicians_by_type ==")
print(json.dumps(c.get("/api/metric/p8_clinicians_by_type").json(), indent=2, default=str))

print("\n== GET /api/metric/bogus (should be 404) ==")
r = c.get("/api/metric/bogus")
print("status:", r.status_code, r.json())
