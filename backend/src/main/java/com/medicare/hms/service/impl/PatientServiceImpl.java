package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.PatientRequest;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.PatientResponse;
import com.medicare.hms.entity.Patient;
import com.medicare.hms.exception.ConflictException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.PatientRepository;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.PatientService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;

    public PatientServiceImpl(PatientRepository patientRepository,
                              EntityDtoMapper mapper,
                              AuditLogService auditLogService) {
        this.patientRepository = patientRepository;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public PatientResponse createPatient(PatientRequest request, String performedBy) {
        String regNumber = generateRegistrationNumber();

        Patient patient = new Patient();
        patient.setRegistrationNumber(regNumber);
        patient.setFullName(request.getFullName().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender().trim());
        patient.setPhone(request.getPhone().trim());
        patient.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        patient.setAddress(request.getAddress().trim());
        patient.setEmergencyContactName(request.getEmergencyContactName().trim());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setActive(request.getActive() == null || request.getActive());

        Patient saved = patientRepository.save(patient);

        auditLogService.logAction("PATIENT_REGISTERED", "Patient", saved.getId(), performedBy,
                "Registered patient " + saved.getFullName() + " with reg# " + saved.getRegistrationNumber());

        return mapper.toPatientResponse(saved);
    }

    @Override
    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request, String performedBy) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        patient.setFullName(request.getFullName().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender().trim());
        patient.setPhone(request.getPhone().trim());
        patient.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        patient.setAddress(request.getAddress().trim());
        patient.setEmergencyContactName(request.getEmergencyContactName().trim());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        patient.setBloodGroup(request.getBloodGroup());
        if (request.getActive() != null) {
            patient.setActive(request.getActive());
        }

        Patient updated = patientRepository.save(patient);

        auditLogService.logAction("PATIENT_UPDATED", "Patient", updated.getId(), performedBy,
                "Updated details for patient " + updated.getRegistrationNumber());

        return mapper.toPatientResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        return mapper.toPatientResponse(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getPatientByRegistrationNumber(String registrationNumber) {
        Patient patient = patientRepository.findByRegistrationNumber(registrationNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with registration number: " + registrationNumber));
        return mapper.toPatientResponse(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PatientResponse> getPatients(String search, Boolean active, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Patient> page = patientRepository.findWithFilters(cleanSearch, active, pageable);

        List<PatientResponse> list = page.getContent().stream()
                .map(mapper::toPatientResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                list,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional
    public PatientResponse setPatientStatus(Long id, boolean active, String performedBy) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        patient.setActive(active);
        Patient updated = patientRepository.save(patient);

        auditLogService.logAction("PATIENT_STATUS_CHANGED", "Patient", updated.getId(), performedBy,
                "Changed active status to " + active + " for patient " + updated.getRegistrationNumber());

        return mapper.toPatientResponse(updated);
    }

    private synchronized String generateRegistrationNumber() {
        int year = LocalDate.now().getYear();
        long count = patientRepository.count() + 1;
        String candidate = String.format("MED-%d-%04d", year, count);
        int offset = 1;
        while (patientRepository.existsByRegistrationNumber(candidate)) {
            candidate = String.format("MED-%d-%04d", year, count + offset);
            offset++;
        }
        return candidate;
    }
}
