package com.medicare.hms.config;

import com.medicare.hms.entity.*;
import com.medicare.hms.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository scheduleRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository recordRepository;
    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           DoctorRepository doctorRepository,
                           DoctorScheduleRepository scheduleRepository,
                           PatientRepository patientRepository,
                           AppointmentRepository appointmentRepository,
                           MedicalRecordRepository recordRepository,
                           BillRepository billRepository,
                           PaymentRepository paymentRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.doctorRepository = doctorRepository;
        this.scheduleRepository = scheduleRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.recordRepository = recordRepository;
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains users. Skipping demo data initialization.");
            return;
        }

        log.info("Starting MediCare HMS synthetic demonstration data seeding...");

        // 1. Seed Departments
        Department cardio = departmentRepository.save(new Department(null, "Cardiology", "Comprehensive diagnostic and therapeutic cardiovascular care."));
        Department neuro = departmentRepository.save(new Department(null, "Neurology", "Advanced diagnosis and management of brain and spinal disorders."));
        Department peds = departmentRepository.save(new Department(null, "Pediatrics", "Specialized compassionate pediatric and adolescent health services."));
        Department ortho = departmentRepository.save(new Department(null, "Orthopedics", "Surgical and non-surgical musculoskeletal treatment and sports medicine."));
        Department genMed = departmentRepository.save(new Department(null, "General Medicine", "Primary healthcare, preventive evaluations, and chronic disease therapy."));
        Department derm = departmentRepository.save(new Department(null, "Dermatology", "Clinical dermatology, skin oncology screening, and cosmetic care."));

        // 2. Seed Users
        User adminUser = saveUser("admin", "Admin@123", "admin@medicare.com", "Dr. Sunita Sharma", Role.ADMIN);
        User docUser1 = saveUser("dr.robert", "Doctor@123", "rajesh.verma@medicare.com", "Dr. Rajesh Verma", Role.DOCTOR);
        User docUser2 = saveUser("dr.emily", "Doctor@123", "priya.nair@medicare.com", "Dr. Priya Nair", Role.DOCTOR);
        User docUser3 = saveUser("dr.marcus", "Doctor@123", "arvind.kulkarni@medicare.com", "Dr. Arvind Kulkarni", Role.DOCTOR);
        User docUser4 = saveUser("dr.aisha", "Doctor@123", "aisha.khan@medicare.com", "Dr. Aisha Khan", Role.DOCTOR);
        User recepUser = saveUser("receptionist", "Staff@123", "reception@medicare.com", "Meena Iyer", Role.RECEPTIONIST);
        User billingUser = saveUser("billing", "Staff@123", "billing@medicare.com", "Suresh Pillai", Role.BILLING_STAFF);

        // 3. Seed Doctors
        Doctor doc1 = saveDoctor(docUser1, "Dr. Rajesh Verma", "Cardiology", "MD, DM (Cardiology) - AIIMS New Delhi",
                "+91 98201 23456", "rajesh.verma@medicare.com", cardio, BigDecimal.valueOf(1500.00), 14);
        Doctor doc2 = saveDoctor(docUser2, "Dr. Priya Nair", "Neurology", "MD, DM (Neurology) - CMC Vellore",
                "+91 98765 43210", "priya.nair@medicare.com", neuro, BigDecimal.valueOf(1800.00), 11);
        Doctor doc3 = saveDoctor(docUser3, "Dr. Arvind Kulkarni", "Orthopedics", "MS (Ortho), DNB - Grant Medical College Mumbai",
                "+91 99887 76543", "arvind.kulkarni@medicare.com", ortho, BigDecimal.valueOf(1200.00), 16);
        Doctor doc4 = saveDoctor(docUser4, "Dr. Aisha Khan", "Pediatrics", "MD (Pediatrics), DCH - Maulana Azad Medical College",
                "+91 97654 32109", "aisha.khan@medicare.com", peds, BigDecimal.valueOf(900.00), 9);

        // Seed Schedules for each doctor (All 7 days 09:00 to 17:00)
        List<Doctor> doctors = List.of(doc1, doc2, doc3, doc4);
        for (Doctor doc : doctors) {
            for (DayOfWeek day : DayOfWeek.values()) {
                scheduleRepository.save(new DoctorSchedule(null, doc, day, LocalTime.of(9, 0), LocalTime.of(17, 0), 30, true));
            }
        }

        // 4. Seed Patients
        Patient pat1 = savePatient("MED-2026-0001", "Ananya Krishnan", LocalDate.of(1985, 4, 12), "FEMALE",
                "+91 94450 12345", "ananya.krishnan@example.com", "14, Rajaji Nagar, Bengaluru - 560010",
                "Vivek Krishnan", "+91 94450 12346", "O+");
        Patient pat2 = savePatient("MED-2026-0002", "Rohit Malhotra", LocalDate.of(1978, 9, 23), "MALE",
                "+91 98112 34567", "rohit.malhotra@example.com", "302, Sector 18, Noida - 201301",
                "Seema Malhotra", "+91 98112 34568", "A+");
        Patient pat3 = savePatient("MED-2026-0003", "Diya Patel", LocalDate.of(2015, 6, 18), "FEMALE",
                "+91 97234 56789", "kiran.patel@example.com", "7, Shyamal Cross Road, Ahmedabad - 380015",
                "Kiran Patel", "+91 97234 56790", "B+");
        Patient pat4 = savePatient("MED-2026-0004", "Subramaniam Iyer", LocalDate.of(1962, 11, 4), "MALE",
                "+91 96345 67891", "s.iyer@example.com", "22, Anna Salai, Chennai - 600002",
                "Lakshmi Iyer", "+91 96345 67892", "AB-");
        Patient pat5 = savePatient("MED-2026-0005", "Priya Sharma", LocalDate.of(1993, 2, 15), "FEMALE",
                "+91 95456 78901", "priya.sharma@example.com", "45, Model Town, Ludhiana - 141001",
                "Raj Sharma", "+91 95456 78902", "O-");
        Patient pat6 = savePatient("MED-2026-0006", "Arjun Reddy", LocalDate.of(2001, 8, 30), "MALE",
                "+91 94567 89012", "arjun.reddy@example.com", "8-2-293, Banjara Hills, Hyderabad - 500034",
                "Padma Reddy", "+91 94567 89013", "B-");

        // 5. Seed Appointments
        LocalDate today = LocalDate.now();

        // Past Completed Appointments
        Appointment apt1 = saveAppointment("APT-2026-0001", pat1, doc1, today.minusDays(3),
                LocalTime.of(10, 0), LocalTime.of(10, 30), "Palpitations and occasional shortness of breath during exercise",
                AppointmentStatus.COMPLETED, null, recepUser);

        Appointment apt2 = saveAppointment("APT-2026-0002", pat2, doc2, today.minusDays(1),
                LocalTime.of(14, 0), LocalTime.of(14, 30), "Persistent morning migraines and photo-sensitivity",
                AppointmentStatus.COMPLETED, null, recepUser);

        // Today's Appointments
        Appointment apt3 = saveAppointment("APT-2026-0003", pat3, doc4, today,
                LocalTime.of(10, 0), LocalTime.of(10, 30), "Routine pediatric health checkup and immunization update",
                AppointmentStatus.SCHEDULED, null, recepUser);

        Appointment apt4 = saveAppointment("APT-2026-0004", pat4, doc3, today,
                LocalTime.of(11, 30), LocalTime.of(12, 0), "Right knee pain after light gardening, mild swelling",
                AppointmentStatus.CONFIRMED, null, recepUser);

        Appointment apt5 = saveAppointment("APT-2026-0005", pat5, doc1, today,
                LocalTime.of(15, 0), LocalTime.of(15, 30), "Follow-up blood pressure review and lipid profile check",
                AppointmentStatus.SCHEDULED, null, recepUser);

        // Upcoming Future Appointments
        Appointment apt6 = saveAppointment("APT-2026-0006", pat6, doc2, today.plusDays(2),
                LocalTime.of(11, 0), LocalTime.of(11, 30), "Initial neurology consultation for sleep disturbance and dizziness",
                AppointmentStatus.SCHEDULED, null, recepUser);

        Appointment apt7 = saveAppointment("APT-2026-0007", pat1, doc3, today.plusDays(4),
                LocalTime.of(14, 30), LocalTime.of(15, 0), "Postural lumbar spine discomfort assessment",
                AppointmentStatus.SCHEDULED, null, recepUser);

        // Cancelled and No-Show appointments
        saveAppointment("APT-2026-0008", pat2, doc1, today.minusDays(2),
                LocalTime.of(16, 0), LocalTime.of(16, 30), "Chest tightness assessment",
                AppointmentStatus.CANCELLED, "Patient called to reschedule due to conflicting travel commitments", recepUser);

        saveAppointment("APT-2026-0009", pat4, doc2, today.minusDays(4),
                LocalTime.of(11, 0), LocalTime.of(11, 30), "Periodic neurological review",
                AppointmentStatus.NO_SHOW, null, recepUser);

        // 6. Seed Medical Records for Completed Visits
        MedicalRecord mr1 = new MedicalRecord();
        mr1.setPatient(pat1);
        mr1.setDoctor(doc1);
        mr1.setAppointment(apt1);
        mr1.setVisitDate(today.minusDays(3));
        mr1.setChiefComplaint("Palpitations and episodic exertional dyspnea.");
        mr1.setClinicalNotes("BP 128/82 mmHg, HR 78 bpm. Normal S1/S2 heart sounds, no murmur detected. Resting 12-lead ECG showed regular sinus rhythm.");
        mr1.setDiagnosis("Stage 1 Essential Hypertension; benign sinus arrhythmia.");
        mr1.setTreatmentPlan("Initiate lifestyle modifications, low sodium diet (<2g/day), 30 min daily aerobic exercise. Repeat ambulatory BP monitoring in 4 weeks.");
        mr1.setFollowUpDate(today.plusDays(25));
        mr1.addPrescription(new PrescribedMedicine(null, mr1, "Amlodipine Besylate", "5 mg", "Once daily morning", "30 days", "Take with water with or without food"));
        mr1.addPrescription(new PrescribedMedicine(null, mr1, "Omega-3 Fatty Acids", "1000 mg", "Once daily with meals", "60 days", "Dietary cardiovascular support"));
        recordRepository.save(mr1);

        MedicalRecord mr2 = new MedicalRecord();
        mr2.setPatient(pat2);
        mr2.setDoctor(doc2);
        mr2.setAppointment(apt2);
        mr2.setVisitDate(today.minusDays(1));
        mr2.setChiefComplaint("Unilateral throbbing headache with nausea and photophobia lasting 6-8 hours.");
        mr2.setClinicalNotes("Cranial nerve examination intact II-XII. Fundoscopy normal, no papilledema. Deep tendon reflexes symmetrical. Tension trigger points identified along trapezius.");
        mr2.setDiagnosis("Migraine without aura (ICD-10 G43.0); secondary cervical muscle spasm.");
        mr2.setTreatmentPlan("Abortive therapy at onset of aura/headache. Sleep hygiene and hydration counseling. Keep headache diary.");
        mr2.setFollowUpDate(today.plusDays(30));
        mr2.addPrescription(new PrescribedMedicine(null, mr2, "Sumatriptan", "50 mg", "At onset; repeat after 2 hrs if needed", "10 days", "Do not exceed 100 mg in 24 hours"));
        mr2.addPrescription(new PrescribedMedicine(null, mr2, "Naproxen Sodium", "500 mg", "Twice daily with meals as needed", "5 days", "Take with food to protect stomach"));
        recordRepository.save(mr2);

        // 7. Seed Bills & Payments
        // Bill 1: Paid in full for Ananya Krishnan
        Bill bill1 = new Bill();
        bill1.setBillNumber("INV-2026-0001");
        bill1.setPatient(pat1);
        bill1.setAppointment(apt1);
        bill1.setConsultationCharge(BigDecimal.valueOf(1500.00));
        bill1.setAdditionalCharges(BigDecimal.valueOf(800.00));
        bill1.setDiscount(BigDecimal.valueOf(100.00));
        bill1.setTaxRate(BigDecimal.valueOf(5.00));
        BigDecimal sub1 = BigDecimal.valueOf(2200.00);
        BigDecimal tax1 = sub1.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP); // 110.00
        bill1.setTaxAmount(tax1);
        bill1.setTotalAmount(sub1.add(tax1)); // 2310.00
        bill1.setPaidAmount(sub1.add(tax1));
        bill1.setBalanceDue(BigDecimal.ZERO);
        bill1.setPaymentStatus(BillPaymentStatus.PAID);
        bill1.setDueDate(today.plusDays(10));
        bill1.setNotes("Settled via UPI on consultation day.");
        bill1.addItem(new BillItem(null, bill1, "12-Lead Electrocardiogram (ECG)", 1, BigDecimal.valueOf(800.00), BigDecimal.valueOf(800.00)));
        Bill savedBill1 = billRepository.save(bill1);

        Payment pay1 = new Payment(null, "PAY-2026-0001", savedBill1, savedBill1.getTotalAmount(),
                "UPI", "TXN-UPI-982134", LocalDateTime.now().minusDays(3), billingUser, "SUCCESS", "UPI payment confirmed");
        paymentRepository.save(pay1);

        // Bill 2: Partially paid for Rohit Malhotra
        Bill bill2 = new Bill();
        bill2.setBillNumber("INV-2026-0002");
        bill2.setPatient(pat2);
        bill2.setAppointment(apt2);
        bill2.setConsultationCharge(BigDecimal.valueOf(1800.00));
        bill2.setAdditionalCharges(BigDecimal.valueOf(3200.00));
        bill2.setDiscount(BigDecimal.ZERO);
        bill2.setTaxRate(BigDecimal.valueOf(5.00));
        BigDecimal sub2 = BigDecimal.valueOf(5000.00);
        BigDecimal tax2 = BigDecimal.valueOf(250.00);
        bill2.setTaxAmount(tax2);
        bill2.setTotalAmount(BigDecimal.valueOf(5250.00));
        bill2.setPaidAmount(BigDecimal.valueOf(2000.00));
        bill2.setBalanceDue(BigDecimal.valueOf(3250.00));
        bill2.setPaymentStatus(BillPaymentStatus.PARTIALLY_PAID);
        bill2.setDueDate(today.plusDays(14));
        bill2.setNotes("Patient deposited ₹2000 in cash. Balance scheduled for next visit.");
        bill2.addItem(new BillItem(null, bill2, "Neurological Reflex & Cranial Mapping Diagnostic", 1, BigDecimal.valueOf(3200.00), BigDecimal.valueOf(3200.00)));
        Bill savedBill2 = billRepository.save(bill2);

        Payment pay2 = new Payment(null, "PAY-2026-0002", savedBill2, BigDecimal.valueOf(2000.00),
                "CASH", "RCPT-CASH-40291", LocalDateTime.now().minusDays(1), billingUser, "SUCCESS", "Cash received at billing desk");
        paymentRepository.save(pay2);

        // Bill 3: Unpaid for Subramaniam Iyer
        Bill bill3 = new Bill();
        bill3.setBillNumber("INV-2026-0003");
        bill3.setPatient(pat4);
        bill3.setAppointment(apt4);
        bill3.setConsultationCharge(BigDecimal.valueOf(1200.00));
        bill3.setAdditionalCharges(BigDecimal.valueOf(1500.00));
        bill3.setDiscount(BigDecimal.ZERO);
        bill3.setTaxRate(BigDecimal.valueOf(5.00));
        BigDecimal sub3 = BigDecimal.valueOf(2700.00);
        BigDecimal tax3 = BigDecimal.valueOf(135.00);
        bill3.setTaxAmount(tax3);
        bill3.setTotalAmount(BigDecimal.valueOf(2835.00));
        bill3.setPaidAmount(BigDecimal.ZERO);
        bill3.setBalanceDue(BigDecimal.valueOf(2835.00));
        bill3.setPaymentStatus(BillPaymentStatus.UNPAID);
        bill3.setDueDate(today.plusDays(15));
        bill3.setNotes("Pending insurance approval or patient copay.");
        bill3.addItem(new BillItem(null, bill3, "Knee Joint Digital Radiography (X-Ray 2 Views)", 1, BigDecimal.valueOf(1500.00), BigDecimal.valueOf(1500.00)));
        billRepository.save(bill3);

        // 8. Seed Audit Logs
        auditLogRepository.save(new AuditLog(null, "SYSTEM_INITIALIZED", "System", 1L, "SYSTEM", "Initial synthetic database seed completed successfully", "127.0.0.1"));
        auditLogRepository.save(new AuditLog(null, "USER_CREATED", "User", adminUser.getId(), "SYSTEM", "Bootstrap administrator account initialized", "127.0.0.1"));

        log.info("MediCare HMS demonstration data seeded successfully!");
        log.info("Default Login Credentials:");
        log.info("-> ADMIN:          username: 'admin'        password: 'Admin@123'");
        log.info("-> DOCTOR:         username: 'dr.robert'    password: 'Doctor@123'");
        log.info("-> RECEPTIONIST:   username: 'receptionist' password: 'Staff@123'");
        log.info("-> BILLING_STAFF:  username: 'billing'      password: 'Staff@123'");
    }

    private User saveUser(String username, String rawPassword, String email, String fullName, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setActive(true);
        return userRepository.save(user);
    }

    private Doctor saveDoctor(User user, String fullName, String spec, String qual, String phone, String email,
                              Department dept, BigDecimal fee, int exp) {
        Doctor doc = new Doctor();
        doc.setUser(user);
        doc.setFullName(fullName);
        doc.setSpecialization(spec);
        doc.setQualifications(qual);
        doc.setPhone(phone);
        doc.setEmail(email);
        doc.setDepartment(dept);
        doc.setConsultationFee(fee);
        doc.setYearsOfExperience(exp);
        doc.setAvailable(true);
        return doctorRepository.save(doc);
    }

    private Patient savePatient(String reg, String name, LocalDate dob, String gender, String phone,
                                String email, String address, String emergName, String emergPhone, String blood) {
        Patient p = new Patient();
        p.setRegistrationNumber(reg);
        p.setFullName(name);
        p.setDateOfBirth(dob);
        p.setGender(gender);
        p.setPhone(phone);
        p.setEmail(email);
        p.setAddress(address);
        p.setEmergencyContactName(emergName);
        p.setEmergencyContactPhone(emergPhone);
        p.setBloodGroup(blood);
        p.setActive(true);
        return patientRepository.save(p);
    }

    private Appointment saveAppointment(String ref, Patient patient, Doctor doctor, LocalDate date,
                                        LocalTime start, LocalTime end, String reason, AppointmentStatus status,
                                        String cancelReason, User creator) {
        Appointment a = new Appointment();
        a.setAppointmentReference(ref);
        a.setPatient(patient);
        a.setDoctor(doctor);
        a.setAppointmentDate(date);
        a.setStartTime(start);
        a.setEndTime(end);
        a.setDurationMinutes(30);
        a.setReasonForVisit(reason);
        a.setStatus(status);
        a.setCancellationReason(cancelReason);
        a.setCreatedBy(creator);
        return appointmentRepository.save(a);
    }
}
