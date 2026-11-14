package com.medicare.hms.service;

import com.medicare.hms.dto.request.MedicalRecordRequest;
import com.medicare.hms.dto.request.PrescriptionItemRequest;
import com.medicare.hms.dto.response.MedicalRecordResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.exception.ForbiddenException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.impl.MedicalRecordServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository recordRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Spy
    private EntityDtoMapper mapper = new EntityDtoMapper();

    @InjectMocks
    private MedicalRecordServiceImpl medicalRecordService;

    private Patient samplePatient;
    private Doctor doctorAuthor;
    private Doctor otherDoctor;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal receptionistPrincipal;

    @BeforeEach
    void setUp() {
        samplePatient = new Patient(1L, "MED-2026-0001", "Eleanor Vance", LocalDate.of(1985, 4, 12),
                "FEMALE", "+15559012345", "eleanor@example.com", "Address", "Contact", "+15559012346", "O+", true);

        User doctorUser = new User(10L, "dr.robert", "pass", "robert@medicare.com", "Dr. Robert Chen", Role.DOCTOR, true);
        doctorAuthor = new Doctor();
        doctorAuthor.setId(1L);
        doctorAuthor.setUser(doctorUser);
        doctorAuthor.setFullName("Dr. Robert Chen");
        doctorAuthor.setSpecialization("Cardiology");

        otherDoctor = new Doctor();
        otherDoctor.setId(2L);
        otherDoctor.setFullName("Dr. Emily Taylor");

        doctorPrincipal = new UserPrincipal(10L, "dr.robert", "pass", "robert@medicare.com", "Dr. Robert Chen", Role.DOCTOR, true);
        receptionistPrincipal = new UserPrincipal(20L, "receptionist", "pass", "recep@medicare.com", "Jessica Patel", Role.RECEPTIONIST, true);
    }

    @Test
    void testNonClinicalStaff_DeniedMedicalAccess() {
        MedicalRecordRequest request = new MedicalRecordRequest();
        request.setPatientId(1L);

        assertThrows(ForbiddenException.class, () -> medicalRecordService.createMedicalRecord(request, receptionistPrincipal));
        assertThrows(ForbiddenException.class, () -> medicalRecordService.getPatientMedicalRecords(1L, receptionistPrincipal));
    }

    @Test
    void testDoctor_CreateMedicalRecord_Success() {
        MedicalRecordRequest request = new MedicalRecordRequest();
        request.setPatientId(1L);
        request.setVisitDate(LocalDate.now());
        request.setChiefComplaint("Chest tightness and dizziness");
        request.setClinicalNotes("BP 125/80, normal auscultation");
        request.setDiagnosis("Hypertension Stage 1");
        request.setTreatmentPlan("Low salt diet, follow up in 1 month");
        request.setPrescriptions(List.of(
                new PrescriptionItemRequest("Amlodipine", "5mg", "Once daily", "30 days", "Morning")
        ));

        when(doctorRepository.findByUserId(10L)).thenReturn(Optional.of(doctorAuthor));
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(recordRepository.save(any(MedicalRecord.class))).thenAnswer(invocation -> {
            MedicalRecord mr = invocation.getArgument(0);
            mr.setId(100L);
            return mr;
        });

        MedicalRecordResponse response = medicalRecordService.createMedicalRecord(request, doctorPrincipal);

        assertNotNull(response);
        assertEquals("Hypertension Stage 1", response.getDiagnosis());
        assertEquals("Dr. Robert Chen", response.getDoctorName());
        assertEquals(1, response.getPrescriptions().size());
        assertEquals("Amlodipine", response.getPrescriptions().get(0).getMedicineName());
    }

    @Test
    void testDoctor_CannotEditAnotherDoctorsMedicalRecord() {
        MedicalRecord record = new MedicalRecord();
        record.setId(50L);
        record.setDoctor(otherDoctor); // Authored by other doctor
        record.setPatient(samplePatient);

        when(recordRepository.findById(50L)).thenReturn(Optional.of(record));
        when(doctorRepository.findByUserId(10L)).thenReturn(Optional.of(doctorAuthor));

        MedicalRecordRequest updateReq = new MedicalRecordRequest();
        updateReq.setChiefComplaint("Modified");

        assertThrows(ForbiddenException.class, () -> medicalRecordService.updateMedicalRecord(50L, updateReq, doctorPrincipal));
    }
}
