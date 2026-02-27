
import { normalizeTimeTo24h, isSlotMatching, isShiftMatching } from './utils/time.util';

const test = () => {
  console.log('--- Testing normalizeTimeTo24h ---');
  console.log('09:00 AM ->', normalizeTimeTo24h('09:00 AM'));
  console.log('9:00 PM ->', normalizeTimeTo24h('9:00 PM'));
  console.log('12:00 AM ->', normalizeTimeTo24h('12:00 AM'));
  console.log('12:00 PM ->', normalizeTimeTo24h('12:00 PM'));
  console.log('21:00 ->', normalizeTimeTo24h('21:00'));

  console.log('\n--- Testing isSlotMatching (Point Check) ---');
  console.log('Slot 09:00-11:00 vs Filter 10:00 (Expect true) ->', isSlotMatching('09:00', '11:00', '10:00'));
  console.log('Slot 09:00-10:00 vs Filter 10:00 (Expect false) ->', isSlotMatching('09:00', '10:00', '10:00'));
  console.log('Slot 09:00 AM-10:00 AM vs Filter 09:30 AM (Expect true) ->', isSlotMatching('09:00 AM', '10:00 AM', '09:30 AM'));

  console.log('\n--- Testing isSlotMatching (Range Check) ---');
  console.log('Slot 09:00-12:00 vs Filter 10:00-11:00 (Expect true) ->', isSlotMatching('09:00', '12:00', '10:00', '11:00'));
  console.log('Slot 10:00-11:00 vs Filter 09:00-12:00 (Expect false) ->', isSlotMatching('10:00', '11:00', '09:00', '12:00'));

  console.log('\n--- Testing isShiftMatching ---');
  console.log('09:30 AM in MORNING (Expect true) ->', isShiftMatching('09:30 AM', 'MORNING'));
  console.log('03:00 PM in MORNING (Expect false) ->', isShiftMatching('03:00 PM', 'MORNING'));
  console.log('03:00 PM in AFTERNOON (Expect true) ->', isShiftMatching('03:00 PM', 'AFTERNOON'));
};

test();
