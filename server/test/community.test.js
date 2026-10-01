const test = require("node:test");
const assert = require("node:assert/strict");
const { validStops } = require("../src/controllers/community.controller");
const { pick, editablePlaceFields, newPlaceFields } = require("../src/controllers/admin.controller");

test("accepts ordered itinerary stops", () => {
  assert.equal(validStops([{ place: "abc", order: 0, day: 1 }, { place: "def", order: 1, day: 2 }]), true);
  assert.equal(validStops([{ placeName: "ชุมชนริมน้ำจันทบูร", districtName: "เมืองจันทบุรี", order: 0, day: 1 }]), true);
});

test("rejects itinerary stops without place, order or positive day", () => {
  assert.equal(validStops([{ order: 0, day: 1 }]), false);
  assert.equal(validStops([{ place: "abc", order: -1, day: 1 }]), false);
  assert.equal(validStops([{ place: "abc", order: 0, day: 0 }]), false);
});

test("admin updates only permit documented editable fields", () => {
  assert.deepEqual(pick({ name: { th: "ใหม่" }, role: "admin", location: {}, district: "district-id", slug: "new-place" }, editablePlaceFields), {
    name: { th: "ใหม่" }, location: {}, district: "district-id", slug: "new-place",
  });
  assert.ok(newPlaceFields.includes("categories"));
  assert.ok(newPlaceFields.includes("imageUrls"));
});

test("admin district creation only accepts district fields", () => {
  assert.deepEqual(pick({ code: "MUANG", name: { th: "เมือง" }, role: "admin" }, ["code", "name", "center"]), {
    code: "MUANG", name: { th: "เมือง" },
  });
});
