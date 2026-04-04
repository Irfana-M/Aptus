import { updateStudentProfileSchema } from '../backend/src/validators/student.validator.js';

const testCases = [
  {
    name: "Flat Only - Valid",
    payload: { country: "India", postalCode: "560001" },
    expected: "pass"
  },
  {
    name: "Nested Only - Valid",
    payload: { contactInfo: { country: "India", postalCode: "560001" } },
    expected: "pass"
  },
  {
    name: "Conflict - Nested Wins (Valid)",
    payload: { country: "USA", contactInfo: { country: "India", postalCode: "560001" } },
    expected: "pass"
  },
  {
    name: "Conflict - Nested Wins (Invalid)",
    payload: { country: "India", contactInfo: { country: "USA", postalCode: "123456" } },
    expected: "fail" // USA with 6 digits is invalid
  },
  {
    name: "Invalid Postal Code (India)",
    payload: { country: "India", postalCode: "12345" },
    expected: "fail"
  },
  {
    name: "International Phone - USA",
    payload: { phoneNumber: "+12125550123" },
    expected: "pass"
  },
  {
    name: "Indian Phone - Valid",
    payload: { phoneNumber: "9876543210" },
    expected: "pass"
  },
  {
    name: "Invalid DOB for Age",
    payload: { age: 15, dateOfBirth: "1990-01-01" },
    expected: "fail"
  },
  {
    name: "Valid Age and DOB",
    payload: { age: 15, dateOfBirth: "2011-01-01" },
    expected: "pass"
  }
];

console.log("--- Starting Dual-Format Validation Tests ---\n");

testCases.forEach((t, i) => {
  const result = updateStudentProfileSchema.safeParse(t.payload);
  const status = result.success ? "pass" : "fail";
  
  if (status === t.expected) {
    console.log(`✅ ${i+1}. ${t.name}: SUCCESS`);
  } else {
    console.log(`❌ ${i+1}. ${t.name}: FAILED (Got ${status}, expected ${t.expected})`);
    if (!result.success) {
      console.log("   Errors:", result.error.errors.map(e => e.message).join(", "));
    }
  }
});

console.log("\n--- Tests Completed ---");
