# Testing Plan — FaFaFront SE Project (US1–US6)

> **สถานะเอกสาร:** แผนทดสอบ (ยังไม่ได้รัน)  
> **วันที่จัดทำ:** 27 ตุลาคม 2026  
> **ขอบเขต:** ทดสอบเชิงฟังก์ชันจาก User Stories US1–US6 โดยใช้ Equivalence Partitioning ครอบคลุมทั้งข้อมูลที่ยอมรับและปฏิเสธ

## 1. แหล่งอ้างอิงและสมมติฐาน

อ้างอิง User Stories ใน [FaFaFront/se-project GitHub Project](https://github.com/orgs/FaFaFront/projects/1/views/1) และ issue ที่เกี่ยวข้องใน repository เช่น US1-1 ถึง US1-3, US2-1 ถึง US2-7, US3-1 ถึง US3-2, US4-1 ถึง US4-2, US5-1 ถึง US5-5 และ US6-1 ถึง US6-5 รวมถึง acceptance criteria ของแต่ละ issue

- ข้อมูลบัญชีสำหรับทดสอบเป็นข้อมูลจำลองและแยกตาม role: `student` และ `tutor`
- กรณีวันที่/เวลาอ้างอิงเวลาของเซิร์ฟเวอร์; ทดสอบขอบเขตเวลาโดยกำหนดเวลาปัจจุบันให้ควบคุมได้
- จำนวนเงินคำนวณเป็นทศนิยม 2 ตำแหน่งตามกติกาของระบบ
- `Actual Outputs` เป็น `ยังไม่ได้รัน` ไว้กรอกผลจริงเมื่อดำเนินการทดสอบ
- US6-1 ทดสอบกับ Google Workspace/OAuth ที่ตั้งค่าใช้งานได้; การทดสอบข้อผิดพลาดภายนอกให้จำลอง Meet API ล้มเหลว

## 2. Input Equivalence Classes

Class `V` หมายถึงค่าที่ควรยอมรับ (Valid) และ `I` หมายถึงค่าที่ควรถูกปฏิเสธ (Invalid) ค่าในคลาสเดียวกันคาดว่าจะได้ผลลัพธ์ประเภทเดียวกัน จึงเลือกค่าตัวแทนอย่างน้อยหนึ่งค่าต่อคลาส

### US1 — สมัครสมาชิก เข้าสู่ระบบ และทำโปรไฟล์เริ่มต้น

| Class  | อินพุต/เงื่อนไข                                 | ประเภท | ผลที่คาดหวัง                             |
| ------ | ----------------------------------------------- | ------ | ---------------------------------------- |
| U1-E1  | อีเมลรูปแบบถูกต้องและยังไม่ถูกใช้               | V      | สมัครสำเร็จ                              |
| U1-E2  | อีเมลว่างหรือรูปแบบไม่ถูกต้อง                   | I      | แจ้ง validation error; ไม่สร้างบัญชี     |
| U1-E3  | อีเมลมีบัญชีอยู่แล้ว                            | I      | แจ้งอีเมลซ้ำ; ไม่สร้างบัญชีซ้ำ           |
| U1-P1  | รหัสผ่านยาวอย่างน้อย 8 ตัวอักษร                 | V      | สมัครสำเร็จและเก็บเป็น hash              |
| U1-P2  | รหัสผ่านว่างหรือยาวน้อยกว่า 8 ตัวอักษร          | I      | แจ้ง validation error                    |
| U1-R1  | role เป็น `student` หรือ `tutor`                | V      | เก็บ role ตรงตามที่เลือก                 |
| U1-R2  | role หายไปหรือเป็นค่าอื่น                       | I      | ปฏิเสธคำขอ                               |
| U1-A1  | อีเมลและรหัสผ่านถูกต้องของบัญชีที่มีอยู่        | V      | เข้าสู่ระบบและได้รับ token               |
| U1-A2  | อีเมลไม่มีในระบบ หรือรหัสผ่านไม่ถูกต้อง         | I      | error ข้อความทั่วไปแบบเดียวกัน           |
| U1-A3  | token ถูกต้อง / ไม่มี / หมดอายุหรือผิดรูปแบบ    | V/I    | อนุญาต / ปฏิเสธด้วย 401                  |
| U1-PR1 | student ส่ง `gradeLevel` และ `goals` ครบ        | V      | บันทึกและตั้ง profile complete           |
| U1-PR2 | tutor ส่ง `hourlyRate` เป็นจำนวนบวก             | V      | บันทึกและตั้ง profile complete           |
| U1-PR3 | ข้อมูลโปรไฟล์ role-specific ขาดหรือไม่ถูกต้อง   | I      | แสดง validation error; ไม่ mark complete |
| U1-PR4 | โปรไฟล์ยังไม่ครบและเปิดหน้าที่ต้องลงชื่อเข้าใช้ | I      | guard พาไปหน้า complete profile          |

### US2 — โปรไฟล์ การตั้งค่าสถานะ และยอดเงิน

| Class | อินพุต/เงื่อนไข                                        | ประเภท | ผลที่คาดหวัง                                         |
| ----- | ------------------------------------------------------ | ------ | ---------------------------------------------------- |
| U2-P1 | ผู้ใช้ที่ลงชื่อเข้าใช้เปิดโปรไฟล์ของตน                 | V      | แสดงข้อมูลทั่วไปและข้อมูลตาม role                    |
| U2-P2 | ไม่มี token หรือ token ใช้ไม่ได้                       | I      | ปฏิเสธ/redirect ไป login                             |
| U2-P3 | ผู้ใช้พยายามอ่านข้อมูลส่วนตัวของผู้อื่น                | I      | ไม่เปิดเผย email/โทรศัพท์/Line ID                    |
| U2-E1 | แก้ข้อมูลโปรไฟล์ด้วยค่าที่ถูกต้องตาม role              | V      | บันทึกและแสดงค่าล่าสุด                               |
| U2-E2 | ส่งค่าที่ไม่ผ่านกฎ validation หรือแก้ field ที่ห้ามแก้ | I      | ปฏิเสธและไม่เปลี่ยนข้อมูลเดิม                        |
| U2-T1 | tutor สลับ active ↔ inactive                           | V      | บันทึกสถานะ; มีผลกับการค้นหา/รับงานใหม่              |
| U2-T2 | tutor inactive แต่มีห้องเรียนหรือยอดเงินค้าง           | V      | ยังสลับเป็น inactive ได้                             |
| U2-T3 | student หรือผู้ไม่มีสิทธิ์เปลี่ยนสถานะ tutor           | I      | ปฏิเสธ                                               |
| U2-B1 | student เลือกยอดเติมเงินจากรายการ preset               | V      | เพิ่ม balance ตามยอดที่เลือก                         |
| U2-B2 | ไม่เลือกยอด หรือส่งยอดที่ไม่มีในรายการ preset          | I      | แจ้งเตือน; balance ไม่เปลี่ยน                        |
| U2-B3 | role ไม่ใช่ student เข้าหน้าเติมเงิน                   | I      | ปฏิเสธ/redirect                                      |
| U2-W1 | tutor เลือกยอดถอน preset ที่ไม่เกิน balance            | V      | ลด balance ตามยอดที่เลือก                            |
| U2-W2 | ไม่เลือกยอด หรือยอดถอนมากกว่า balance                  | I      | แจ้ง error; balance ไม่เปลี่ยน                       |
| U2-W3 | role ไม่ใช่ tutor เข้าหน้าถอนเงิน                      | I      | ปฏิเสธ/redirect                                      |
| U2-L1 | ผู้ใช้กด logout โดยมี token / ไม่มี session            | V      | ออกจากระบบและเข้า protected route ไม่ได้; API ไม่ล้ม |

### US3 — ค้นหาและดูข้อมูลติวเตอร์

| Class | อินพุต/เงื่อนไข                                         | ประเภท   | ผลที่คาดหวัง                                                   |
| ----- | ------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| U3-S1 | คำค้น/วิชา/ตัวกรองที่ตรงกับ tutor active                | V        | แสดงผลลัพธ์ที่ตรงเงื่อนไข                                      |
| U3-S2 | คำค้นหรือชุดตัวกรองที่ไม่พบผลลัพธ์                      | V        | แสดง empty state                                               |
| U3-S3 | tutor inactive หรือพารามิเตอร์ filter ไม่ถูกต้อง        | I/ขอบเขต | ไม่แสดง tutor inactive; ปฏิเสธ/ละเว้น filter ไม่ถูกต้องตาม API |
| U3-D1 | เปิดรายละเอียด tutor ที่มีข้อมูลและรีวิว                | V        | แสดงข้อมูลและรีวิวจริง พร้อมค่าเฉลี่ยถูกต้อง                   |
| U3-D2 | tutor ไม่มีรีวิว                                        | V        | แสดง empty state และไม่มีค่าเฉลี่ยที่ทำให้เข้าใจผิด            |
| U3-D3 | tutor ID ไม่มีหรือไม่ถูกต้อง                            | I        | แสดง not found/error state                                     |
| U3-M1 | student ลงชื่อเข้าใช้และเริ่มติดต่อ tutor               | V        | เปิด/สร้างช่องทางสนทนากับ tutor ที่เลือก                       |
| U3-M2 | ผู้ไม่มีสิทธิ์หรือ tutor inactive พยายามเริ่มรายการใหม่ | I        | ปฏิเสธหรือไม่เสนอ tutor ให้เลือก                               |

### US4 — กล่องข้อความและแชตเรียลไทม์

| Class | อินพุต/เงื่อนไข                                         | ประเภท | ผลที่คาดหวัง                                                |
| ----- | ------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| U4-I1 | ผู้ใช้ที่เป็นสมาชิกเปิด inbox ที่มี/ไม่มีบทสนทนา        | V      | แสดงรายการหรือ empty state ที่ถูกต้อง                       |
| U4-I2 | ไม่มี token หรือไม่ใช่สมาชิกของ conversation            | I      | ปฏิเสธการเข้าถึง                                            |
| U4-M1 | ส่งข้อความ text ที่ไม่ว่างใน conversation ที่เข้าถึงได้ | V      | บันทึกและแสดงข้อความทั้งสองฝั่งแบบเรียลไทม์                 |
| U4-M2 | ข้อความว่าง/มีแต่ช่องว่าง หรือ payload ไม่ถูกต้อง       | I      | ปฏิเสธ; ไม่สร้างข้อความ                                     |
| U4-M3 | ส่งข้อความด้วย socket ที่ไม่มี/มี token หมดอายุ         | I      | ไม่เชื่อมต่อหรือไม่รับคำสั่ง                                |
| U4-M4 | ผู้ใช้ที่ไม่ใช่ participant ส่งข้อความเข้า conversation | I      | ปฏิเสธและไม่ broadcast                                      |
| U4-S1 | system message จาก flow นัดเรียน/ชำระเงิน               | V      | แสดงเป็น notice แยกจากข้อความผู้ใช้และ preview ใน inbox ได้ |

### US5 — สร้าง ค้นหา แก้ไข ดู และปิดห้องเรียน

| Class | อินพุต/เงื่อนไข                                                                                       | ประเภท | ผลที่คาดหวัง                                       |
| ----- | ----------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| U5-C1 | student สร้างห้องเรียนจาก conversation ที่เกี่ยวข้อง โดยข้อมูลครบ/ถูกต้อง                             | V      | สร้างห้องเรียน active กับ tutor/student ที่ถูกต้อง |
| U5-C2 | conversation/subject ไม่มี หรือผู้ใช้ไม่ใช่ student ที่เกี่ยวข้อง                                     | I      | ปฏิเสธ; ไม่สร้างห้องเรียน                          |
| U5-C3 | ราคา/ข้อมูลห้องเรียนขาดหรืออยู่นอกข้อกำหนด                                                            | I      | แจ้ง validation error                              |
| U5-D1 | tutor เจ้าของหรือ student คู่ห้องเรียนเปิดรายละเอียด                                                  | V      | แสดงข้อมูลตาม role และสิทธิ์                       |
| U5-D2 | ผู้ใช้ที่ไม่ใช่ participant หรือ ID ไม่มี                                                             | I      | ปฏิเสธ/404; ไม่เผยข้อมูล                           |
| U5-E1 | tutor เจ้าของแก้ subject ที่สอนและราคา > 0 ไม่เกิน precision/maximum                                  | V      | บันทึกข้อมูลที่แก้                                 |
| U5-E2 | ราคา 0/ติดลบ/เกินขอบเขต/ทศนิยมเกิน 2 ตำแหน่ง หรือ subject ไม่ได้สอน                                   | I      | ปฏิเสธ; ค่าเดิมไม่เปลี่ยน                          |
| U5-E3 | student, tutor คนอื่น หรือส่ง field ที่ห้ามแก้                                                        | I      | ปฏิเสธ; ห้ามแก้ owner/status/id                    |
| U5-F1 | คำค้นและตัวกรองห้องเรียนที่ถูกต้อง                                                                    | V      | แสดงเฉพาะห้องเรียนที่ตรงเงื่อนไข                   |
| U5-F2 | คำค้นไม่พบห้องเรียนหรือ filter ที่ไม่มีผลลัพธ์                                                        | V      | แสดง empty state                                   |
| U5-X1 | tutor เจ้าของปิดห้องเรียน active ที่ไม่มี session ongoing                                             | V      | สถานะเป็น completed; session scheduled ถูก cancel  |
| U5-X2 | student/tutor คนอื่น หรือห้องเรียนที่ปิดแล้วสั่งปิด                                                   | I      | ปฏิเสธหรือไม่ทำซ้ำจนข้อมูลเสีย                     |
| U5-X3 | มี session ongoing ขณะขอปิดห้องเรียน                                                                  | I      | ปฏิเสธ; ห้องเรียนยัง active                        |
| U5-R1 | student ส่งรีวิวห้อง completed ด้วย rating 1–5 และ comment ว่าง/ไม่เกิน 1000 ตัวอักษร                 | V      | บันทึกรีวิวหนึ่งรายการ                             |
| U5-R2 | rating หาย/นอก 1–5, comment เกิน 1000 ตัวอักษร, ห้องยัง active, ซ้ำ, หรือผู้ส่งไม่ใช่ student เจ้าของ | I      | ปฏิเสธ; ไม่สร้าง/แก้รีวิวเดิม                      |
| U5-R3 | tutor detail มีรีวิว / ไม่มีรีวิว                                                                     | V      | แสดงรีวิวจริงและค่าเฉลี่ย / แสดง empty state       |

### US6 — Google Meet, นัดเรียน, เข้าร่วม, settlement และแจ้งผล

| Class | อินพุต/เงื่อนไข                                                                                                                     | ประเภท        | ผลที่คาดหวัง                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| U6-G1 | credentials/ผู้ใช้ Workspace ใช้งานได้และสร้าง Meet space                                                                           | V             | ได้ meeting URI และ space name                                                             |
| U6-G2 | credentials ไม่พร้อม, สิทธิ์ไม่พอ หรือ Meet API ล้มเหลว                                                                             | I/ระบบผิดพลาด | แจ้งข้อผิดพลาด; flow ที่สร้าง session ต้องไม่บันทึก session ครึ่งรายการ                    |
| U6-S1 | tutor เจ้าของสร้าง session ใน active classroom, เริ่ม ≥30 นาทีข้างหน้า, duration 0.5–4 ชม. ทีละครึ่งชั่วโมง, ไม่ทับซ้อน             | V             | สร้าง session scheduled พร้อม Meet link และข้อความแจ้งใน chat                              |
| U6-S2 | เริ่ม <30 นาที, duration นอกช่วง/step, เวลาไม่ถูกต้อง, classroom completed, หรือชนกับ session ที่ยังไม่ cancelled ของ tutor/student | I             | ปฏิเสธ; ไม่มี session ใหม่                                                                 |
| U6-S3 | student หรือ tutor ที่ไม่ใช่เจ้าของสร้าง/ยกเลิก session                                                                             | I             | ปฏิเสธ                                                                                     |
| U6-S4 | tutor เจ้าของยกเลิก session scheduled/ongoing ก่อน settlement                                                                       | V             | สถานะ cancelled; ไม่คิดเงินและส่งข้อความแจ้ง                                               |
| U6-S5 | ยกเลิก session completed/missed/cancelled                                                                                           | I             | ปฏิเสธ                                                                                     |
| U6-J1 | participant ดูรายการ sessions                                                                                                       | V             | upcoming/past แสดงวันเวลา ระยะเวลา ราคา สถานะ; ไม่มี Meet link                             |
| U6-J2 | non-participant ดูรายการหรือ join session                                                                                           | I             | ปฏิเสธ/404 ตาม endpoint                                                                    |
| U6-J3 | join ในช่วง `[scheduledAt−10 นาที, scheduledAt+duration]` และมี balance พอสำหรับ student                                            | V             | คืน Meet link; บันทึกเวลา join ครั้งแรก; scheduled เปลี่ยนเป็น ongoing                     |
| U6-J4 | join ก่อนเปิดช่วง, หลังเวลาจบ, หรือ status ไม่ใช่ scheduled/ongoing                                                                 | I             | ปฏิเสธ; ไม่คืน Meet link                                                                   |
| U6-J5 | student balance available < cost (รวมภาระ session ที่ join แล้วยังไม่ settle)                                                       | I             | ปฏิเสธพร้อม required/available; ไม่บันทึก join                                             |
| U6-J6 | participant reconnect ใน session เดิมภายในช่วงที่อนุญาต                                                                             | V             | join ได้โดยไม่เขียน timestamp ครั้งแรกทับ                                                  |
| U6-P1 | ทั้ง tutor และ student join แล้ว; conference ended หรือผ่าน fallback 15 นาที                                                        | V             | settle ครั้งเดียว: หัก student, เพิ่ม tutor, transaction คู่, completed และ system message |
| U6-P2 | ฝ่ายใดฝ่ายหนึ่งไม่ join                                                                                                             | V             | สถานะ missed; ไม่เปลี่ยน balance และแจ้ง chat                                              |
| U6-P3 | session cancelled หรือ settlement ถูกเรียกซ้ำ                                                                                       | V             | ไม่คิดเงินซ้ำ/ไม่สร้าง transaction ซ้ำ                                                     |
| U6-P4 | settlement transaction ล้มเหลว                                                                                                      | I/ระบบผิดพลาด | rollback ทั้ง balance, transaction และ status; retry รอบถัดไปได้                           |

## 3. Test Cases

ทุกกรณีต้องเตรียมข้อมูลเริ่มต้นที่ระบุ, ทำความสะอาดข้อมูลที่สร้างหลังทดสอบ และตรวจทั้งผลบน UI กับ API/ฐานข้อมูลเมื่อเหมาะสม `Expected Outputs` ระบุผลที่ต้องได้ ส่วน `Actual Outputs` จะกรอกหลังรันทดสอบจริง

| Test Case ID | Inputs                                                                                                                                                          | Expected Outputs                                                                                                             | Actual Outputs | Equivalence Classes Covered |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------- |
| TC-US1-01    | สมัครด้วยอีเมลใหม่, password 8+ ตัวอักษร, role student; ทำซ้ำด้วย role tutor                                                                                    | สร้างบัญชี role ถูกต้อง, ได้ token; password ใน DB เป็น hash                                                                 | ยังไม่ได้รัน   | U1-E1, U1-P1, U1-R1         |
| TC-US1-02    | สมัครด้วยอีเมลว่าง/ผิดรูปแบบ, password สั้นกว่า 8, role หายหรือผิดค่า; ทดสอบอีเมลซ้ำ                                                                            | แต่ละ request ถูกปฏิเสธชัดเจน; ไม่มีบัญชีเพิ่ม/ไม่มีข้อมูลเปลี่ยน                                                            | ยังไม่ได้รัน   | U1-E2, U1-E3, U1-P2, U1-R2  |
| TC-US1-03    | login ด้วย credential ถูกต้อง, รหัสผ่านผิด, อีเมลไม่มีในระบบ                                                                                                    | สำเร็จได้ token; สองกรณีผิดได้ generic error เดียวกัน                                                                        | ยังไม่ได้รัน   | U1-A1, U1-A2                |
| TC-US1-04    | เรียก authenticated endpoint ด้วย token ถูกต้อง, ไม่มี token, token หมดอายุ/ผิดรูปแบบ                                                                           | token ถูกต้องผ่าน; ที่เหลือ 401 และไม่คืนข้อมูลส่วนตัว                                                                       | ยังไม่ได้รัน   | U1-A3                       |
| TC-US1-05    | ส่ง profile student ครบและไม่ครบ; ส่ง profile tutor hourlyRate บวก, 0/ลบ/หาย                                                                                    | ข้อมูลครบตาม role ถูกบันทึก; ค่าผิดถูกปฏิเสธและ profile ยังไม่ complete                                                      | ยังไม่ได้รัน   | U1-PR1, U1-PR2, U1-PR3      |
| TC-US1-06    | ใช้บัญชี profile incomplete เปิด route protected แล้ว submit profile ครบ                                                                                        | ก่อนครบถูกพาไป complete-profile; หลังสำเร็จเข้าหน้าปกติได้                                                                   | ยังไม่ได้รัน   | U1-PR4                      |
| TC-US2-01    | student/tutor ดูโปรไฟล์ตน; ทดลอง token ไม่มีและเรียกข้อมูล private ของ user อื่น                                                                                | แสดง field ตาม role เฉพาะเจ้าของ; unauthenticated ถูกปฏิเสธ                                                                  | ยังไม่ได้รัน   | U2-P1, U2-P2, U2-P3         |
| TC-US2-02    | แก้ profile ด้วยข้อมูล valid, ข้อมูล invalid และ payload มี email/role/password/wallet field                                                                    | valid ถูกบันทึกและอ่านกลับได้; invalid/restricted ถูกปฏิเสธโดยข้อมูลเดิมคงอยู่                                               | ยังไม่ได้รัน   | U2-E1, U2-E2                |
| TC-US2-03    | tutor active→inactive ขณะมี class/balance ค้าง, ค้นหา tutor; inactive→active; ลองด้วย student                                                                   | toggle สำเร็จได้ทุกทิศทางโดยไม่ block ภาระ; inactive ไม่ปรากฏในรายการใหม่; student เปลี่ยนไม่ได้                             | ยังไม่ได้รัน   | U2-T1, U2-T2, U2-T3, U3-S3  |
| TC-US2-04    | student เติมด้วย preset ทุกค่า; ไม่เลือก/ส่งค่านอก preset; ลองเปิดหน้าในฐานะ tutor                                                                              | ยอดเพิ่มเท่าค่าที่เลือก; invalid ไม่เปลี่ยนยอด; tutor เข้าไม่ได้                                                             | ยังไม่ได้รัน   | U2-B1, U2-B2, U2-B3         |
| TC-US2-05    | tutor ถอน ≤ balance; ถอนเกิน balance/ไม่เลือก; ลองเปิดหน้าในฐานะ student                                                                                        | ถอนสำเร็จลด balance ถูกต้อง; invalid ไม่เปลี่ยนยอด; student เข้าไม่ได้                                                       | ยังไม่ได้รัน   | U2-W1, U2-W2, U2-W3         |
| TC-US2-06    | logout ขณะ login, จากนั้นเปิด protected route; เรียก logout โดยไม่มี session                                                                                    | token ถูกลบ/ออกจากระบบและถูก redirect; endpoint ไม่มี session ไม่ crash                                                      | ยังไม่ได้รัน   | U2-L1                       |
| TC-US3-01    | ค้น tutor ด้วย keyword/subject/filter ที่พบ, ไม่พบ, และตรวจผลเมื่อ tutor inactive                                                                               | ผลตรง filter; กรณีไม่มีผลมี empty state; tutor inactive ถูกตัดออก                                                            | ยังไม่ได้รัน   | U3-S1, U3-S2, U3-S3         |
| TC-US3-02    | เปิด tutor detail ที่ valid มีรีวิว, ไม่มีรีวิว, และ ID ไม่มี                                                                                                   | รายละเอียด/ค่าเฉลี่ยจริงถูกต้อง; ไม่มีรีวิวเป็น empty state; ID ผิดเป็น not found                                            | ยังไม่ได้รัน   | U3-D1, U3-D2, U3-D3, U3-R3  |
| TC-US3-03    | student เริ่ม chat จาก tutor detail; ลองเริ่มกับ tutor ที่ inactive/ด้วย role ที่ไม่อนุญาต                                                                      | เริ่มหรือเปิด conversation ที่ถูกต้อง; กรณีไม่ได้รับอนุญาตถูกปฏิเสธ                                                          | ยังไม่ได้รัน   | U3-M1, U3-M2                |
| TC-US4-01    | เปิด inbox ในฐานะ participant ที่มี/ไม่มี conversation; เปิดโดยไม่มี token และโดย non-participant                                                               | แสดงรายการ/empty state; กรณีไม่มีสิทธิ์ถูกปฏิเสธ                                                                             | ยังไม่ได้รัน   | U4-I1, U4-I2                |
| TC-US4-02    | ส่งข้อความปกติที่ไม่ว่างจาก participant ผ่าน socket ที่ authenticate แล้ว; ส่งค่าว่าง                                                                           | ข้อความ valid ถูกบันทึกและแสดงทันทีทั้งสอง client; ค่าว่างไม่มี record                                                       | ยังไม่ได้รัน   | U4-M1, U4-M2                |
| TC-US4-03    | connect/send โดยไม่มีหรือ token หมดอายุ; non-participant ส่ง; ตรวจ system message                                                                               | auth/สิทธิ์ผิดถูกปฏิเสธและไม่ broadcast; system message แสดงแยกจาก user bubble และเห็นใน inbox preview                       | ยังไม่ได้รัน   | U4-M3, U4-M4, U4-S1         |
| TC-US5-01    | student สร้าง classroom ผ่าน conversation/subject ที่ถูกต้อง; ส่ง conversation/subject ผิด, role ผิด, ราคาไม่ valid                                             | สร้าง classroom ถูกต้องเมื่อข้อมูลครบ; request ผิดไม่สร้าง record                                                            | ยังไม่ได้รัน   | U5-C1, U5-C2, U5-C3         |
| TC-US5-02    | tutor เจ้าของ/student คู่ห้องดู detail; ทดลอง user อื่นและ ID ไม่มี                                                                                             | แสดงข้อมูลตาม role; ผู้ไม่เกี่ยวข้องไม่เห็นข้อมูลและได้รับ error ที่กำหนด                                                    | ยังไม่ได้รัน   | U5-D1, U5-D2                |
| TC-US5-03    | tutor แก้ subject ที่สอนและราคา valid; ราคา 0, ติดลบ, เกิน max, >2 decimals, subject ไม่สอน; student/owner อื่นและ extra fields                                 | valid บันทึกเฉพาะ subject/price; invalid/unauthorized ถูกปฏิเสธและข้อมูลเดิมไม่เปลี่ยน                                       | ยังไม่ได้รัน   | U5-E1, U5-E2, U5-E3         |
| TC-US5-04    | ค้น classroom ด้วย keyword/filter ที่พบและไม่พบ                                                                                                                 | แสดงเฉพาะรายการตรงเงื่อนไข; กรณีไม่พบมี empty state                                                                          | ยังไม่ได้รัน   | U5-F1, U5-F2                |
| TC-US5-05    | tutor เจ้าของปิด active classroom ที่มี scheduled session; ทำซ้ำด้วย ongoing session; ลองด้วย student/owner อื่น                                                | กรณีแรก completed และ scheduled sessions cancelled; กรณี ongoing ถูกปฏิเสธโดยไม่ปิด; role ผิดถูกปฏิเสธ                       | ยังไม่ได้รัน   | U5-X1, U5-X2, U5-X3         |
| TC-US5-06    | student รีวิว classroom completed ด้วย rating 1 และ 5, comment ว่าง/ยาว 1000; ทดลอง rating 0/6/หาย, comment 1001, active class, duplicate, tutor/nonparticipant | rating/comment ขอบเขต valid บันทึกครั้งเดียว; invalid/สิทธิ์ผิดไม่สร้าง review; detail แสดงรีวิวและค่าเฉลี่ยจริง/empty state | ยังไม่ได้รัน   | U5-R1, U5-R2, U5-R3         |
| TC-US6-01    | สร้าง Meet space ด้วย credential ที่ใช้ได้; จำลอง credential/API ผิดพลาด                                                                                        | สำเร็จได้ URI/space name; error แสดงชัดและไม่เหลือ session บันทึกครึ่งรายการ                                                 | ยังไม่ได้รัน   | U6-G1, U6-G2                |
| TC-US6-02    | tutor สร้าง session ≥30 นาที, duration 0.5/4 ชั่วโมง; ทดลอง <30 นาที, duration 0/0.25/4.5, overlap, classroom completed, role/owner ผิด                         | สร้าง scheduled session เมื่อ valid; invalid ไม่สร้าง session; student ได้ system message เมื่อสร้างสำเร็จ                   | ยังไม่ได้รัน   | U6-S1, U6-S2, U6-S3         |
| TC-US6-03    | tutor cancel scheduled/ongoing; cancel completed/missed/cancelled; student/non-owner cancel                                                                     | valid เปลี่ยนเป็น cancelled, แจ้ง chat และไม่ถูก charge; กรณีอื่นถูกปฏิเสธ                                                   | ยังไม่ได้รัน   | U6-S4, U6-S5                |
| TC-US6-04    | participant เปิด sessions list; nonparticipant เปิด; ตรวจ payload ว่ามี/ไม่มี meetLink และ empty state                                                          | upcoming/past แสดง field ที่กำหนด; meetLink ไม่อยู่ใน list; nonparticipant เข้าไม่ได้                                        | ยังไม่ได้รัน   | U6-J1, U6-J2                |
| TC-US6-05    | join ที่ก่อนเวลา 11 นาที, ขอบเปิด −10 นาที, ก่อน scheduled end เล็กน้อย, หลัง end; status cancelled/completed                                                   | ขอบเขต join window ทำงานตาม server time; valid ได้ link/บันทึก join; invalid ไม่ได้ link                                     | ยังไม่ได้รัน   | U6-J3, U6-J4                |
| TC-US6-06    | student join ด้วย available balance เท่ากับ cost, ต่ำกว่า cost; มี session อื่นที่ join แล้วยังไม่ settle; reconnect                                            | balance พอ join ได้; ไม่พอถูกปฏิเสธพร้อม required/available; คิดภาระอื่นถูกต้อง; reconnect ไม่เขียนเวลาแรกทับ                | ยังไม่ได้รัน   | U6-J3, U6-J5, U6-J6         |
| TC-US6-07    | ทั้งสองฝ่าย join แล้วและ Meet endTime พร้อม; จำลองไม่มี conference record หลัง scheduled end 15 นาที; ตรวจ transaction/balance/chat                             | settle ตาม price×duration เพียงครั้งเดียว; status completed, มี transaction คู่และ system notice; fallback ใช้ scheduled end | ยังไม่ได้รัน   | U6-P1                       |
| TC-US6-08    | session จบแต่ tutor หรือ student ไม่ join; cancelled; เรียก settlement ซ้ำ; จำลอง transaction failure                                                           | missed ไม่มีการ charge; cancelled ไม่ถูก charge; retry/idempotency ไม่ซ้ำ; failure rollback ข้อมูลทั้งหมด                    | ยังไม่ได้รัน   | U6-P2, U6-P3, U6-P4         |

## 4. Test Coverage Matrix

`✓` หมายถึงมี test case ครอบคลุมคลาสนั้น; `—` หมายถึงไม่มีคลาสสำหรับ story นั้นในแถวนั้น

| Test Case | US1 | US2 | US3 | US4 | US5 | US6 |
| --------- | :-: | :-: | :-: | :-: | :-: | :-: |
| TC-US1-01 |  ✓  |  —  |  —  |  —  |  —  |  —  |
| TC-US1-02 |  ✓  |  —  |  —  |  —  |  —  |  —  |
| TC-US1-03 |  ✓  |  —  |  —  |  —  |  —  |  —  |
| TC-US1-04 |  ✓  |  —  |  —  |  —  |  —  |  —  |
| TC-US1-05 |  ✓  |  —  |  —  |  —  |  —  |  —  |
| TC-US1-06 |  ✓  |  —  |  —  |  —  |  —  |  —  |
| TC-US2-01 |  —  |  ✓  |  —  |  —  |  —  |  —  |
| TC-US2-02 |  —  |  ✓  |  —  |  —  |  —  |  —  |
| TC-US2-03 |  —  |  ✓  |  ✓  |  —  |  —  |  —  |
| TC-US2-04 |  —  |  ✓  |  —  |  —  |  —  |  —  |
| TC-US2-05 |  —  |  ✓  |  —  |  —  |  —  |  —  |
| TC-US2-06 |  —  |  ✓  |  —  |  —  |  —  |  —  |
| TC-US3-01 |  —  |  —  |  ✓  |  —  |  —  |  —  |
| TC-US3-02 |  —  |  —  |  ✓  |  —  |  —  |  —  |
| TC-US3-03 |  —  |  —  |  ✓  |  ✓  |  —  |  —  |
| TC-US4-01 |  —  |  —  |  —  |  ✓  |  —  |  —  |
| TC-US4-02 |  —  |  —  |  —  |  ✓  |  —  |  —  |
| TC-US4-03 |  —  |  —  |  —  |  ✓  |  —  |  —  |
| TC-US5-01 |  —  |  —  |  —  |  —  |  ✓  |  —  |
| TC-US5-02 |  —  |  —  |  —  |  —  |  ✓  |  —  |
| TC-US5-03 |  —  |  —  |  —  |  —  |  ✓  |  —  |
| TC-US5-04 |  —  |  —  |  —  |  —  |  ✓  |  —  |
| TC-US5-05 |  —  |  —  |  —  |  —  |  ✓  |  ✓  |
| TC-US5-06 |  —  |  —  |  ✓  |  —  |  ✓  |  —  |
| TC-US6-01 |  —  |  —  |  —  |  —  |  —  |  ✓  |
| TC-US6-02 |  —  |  —  |  —  |  ✓  |  ✓  |  ✓  |
| TC-US6-03 |  —  |  —  |  —  |  ✓  |  ✓  |  ✓  |
| TC-US6-04 |  —  |  —  |  —  |  —  |  ✓  |  ✓  |
| TC-US6-05 |  —  |  —  |  —  |  —  |  —  |  ✓  |
| TC-US6-06 |  —  |  ✓  |  —  |  —  |  —  |  ✓  |
| TC-US6-07 |  —  |  —  |  —  |  ✓  |  —  |  ✓  |
| TC-US6-08 |  —  |  ✓  |  —  |  ✓  |  —  |  ✓  |

## 5. เกณฑ์สรุปผล

- ทุก equivalence class ที่ระบุในหัวข้อ 2 ต้องถูกอ้างถึงอย่างน้อยหนึ่งครั้งในหัวข้อ Test Cases
- กรณี valid ผ่านเมื่อผลลัพธ์และข้อมูลที่บันทึกตรง Expected Outputs
- กรณี invalid ผ่านเมื่อระบบปฏิเสธอย่างเหมาะสมและไม่มี side effect ที่ไม่ควรเกิด
- บันทึก `Actual Outputs`, สถานะ `Pass/Fail`, วันเวลารัน และหลักฐาน (response/screenshot/log) ในรอบ execution โดยไม่แก้ Expected Outputs ย้อนหลังเพื่อให้ตรงกับผลจริง
