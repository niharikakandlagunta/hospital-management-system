package com.medicare.hms.service;

import com.medicare.hms.dto.request.PatientRequest;
import com.medicare.hms.dto.response.PatientResponse;
import com.medicare.hms.entity.Patient;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.PatientRepository;
import com.medicare.hms.service.impl.PatientServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AuditLogService auditLogService;

    @Spy
    private EntityDtoMapper mapper = new EntityDtoMapper();

    @InjectMocks
    private PatientServiceImpl patientService;

    private Patient samplePatient;
    private PatientRequest sampleRequest;

    @BeforeEach
    void setUp() {
        samplePatient = new Patient(
                1L,
                "MED-2026-0001",
                "Eleanor Vance",
                LocalDate.of(1985, 4, 12),
                "FEMALE",
                "+1 (555) 901-2345",
                "eleanor.vance@example.com",
                "742 Evergreen Terrace",
                "Thomas Vance",
                "+1 (555) 901-2346",
                "O+",
                true
        );

        sampleRequest = new PatientRequest();
        sampleRequest.setFullName("Eleanor Vance");
        sampleRequest.setDateOfBirth(LocalDate.of(1985, 4, 12));
        sampleRequest.setGender("FEMALE");
        sampleRequest.setPhone("+1 (555) 901-2345");
        sampleRequest.setEmail("eleanor.vance@example.com");
        sampleRequest.setAddress("742 Evergreen Terrace");
        sampleRequest.setEmergencyContactName("Thomas Vance");
        sampleRequest.setEmergencyContactPhone("+1 (555) 901-2346");
        sampleRequest.setBloodGroup("O+");
    }

    @Test
    void testCreatePatient_Success() {
        when(patientRepository.count()).thenReturn(0L);
        when(patientRepository.existsByRegistrationNumber(anyString())).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        PatientResponse response = patientService.createPatient(sampleRequest, "admin");

        assertNotNull(response);
        assertEquals("Eleanor Vance", response.getFullName());
        assertNotNull(response.getRegistrationNumber());
        assertTrue(response.isActive());
        verify(patientRepository, times(1)).save(any(Patient.class));
        verify(auditLogService, times(1)).logAction(eq("PATIENT_REGISTERED"), eq("Patient"), eq(1L), eq("admin"), anyString());
    }

    @Test
    void testGetPatientById_Success() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));

        PatientResponse response = patientService.getPatientById(1L);

        assertNotNull(response);
        assertEquals("MED-2026-0001", response.getRegistrationNumber());
        assertEquals("Eleanor Vance", response.getFullName());
    }

    @Test
    void testGetPatientById_NotFound() {
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientService.getPatientById(999L));
    }

    @Test
    void testSetPatientStatus_Deactivate() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PatientResponse response = patientService.setPatientStatus(1L, false, "admin");

        assertNotNull(response);
        assertFalse(response.isActive());
        verify(auditLogService, times(1)).logAction(eq("PATIENT_STATUS_CHANGED"), eq("Patient"), eq(1L), eq("admin"), anyString());
    }
}
