package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.MedicalRecordRequest;
import com.medicare.hms.dto.request.PrescriptionItemRequest;
import com.medicare.hms.dto.response.MedicalRecordResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.exception.ForbiddenException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.MedicalRecordService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository recordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;

    public MedicalRecordServiceImpl(MedicalRecordRepository recordRepository,
                                    PatientRepository patientRepository,
                                    DoctorRepository doctorRepository,
                                    AppointmentRepository appointmentRepository,
                                    EntityDtoMapper mapper,
                                    AuditLogService auditLogService) {
        this.recordRepository = recordRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public MedicalRecordResponse createMedicalRecord(MedicalRecordRequest request, UserPrincipal currentUser) {
        enforceMedicalAccess(currentUser);

        Doctor doctor = resolveDoctor(currentUser);
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
            if (appointment != null && appointment.getStatus() != AppointmentStatus.COMPLETED) {
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointmentRepository.save(appointment);
            }
        }

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setAppointment(appointment);
        record.setVisitDate(request.getVisitDate() != null ? request.getVisitDate() : LocalDate.now());
        record.setChiefComplaint(request.getChiefComplaint().trim());
        record.setClinicalNotes(request.getClinicalNotes().trim());
        record.setDiagnosis(request.getDiagnosis().trim());
        record.setTreatmentPlan(request.getTreatmentPlan().trim());
        record.setFollowUpDate(request.getFollowUpDate());

        if (request.getPrescriptions() != null) {
            for (PrescriptionItemRequest item : request.getPrescriptions()) {
                PrescribedMedicine med = new PrescribedMedicine();
                med.setMedicineName(item.getMedicineName().trim());
                med.setDosage(item.getDosage().trim());
                med.setFrequency(item.getFrequency().trim());
                med.setDuration(item.getDuration().trim());
                med.setInstructions(item.getInstructions() != null ? item.getInstructions().trim() : null);
                record.addPrescription(med);
            }
        }

        MedicalRecord saved = recordRepository.save(record);

        auditLogService.logAction("MEDICAL_RECORD_CREATED", "MedicalRecord", saved.getId(), currentUser.getUsername(),
                "Created clinical visit record for patient " + patient.getRegistrationNumber() + " by " + doctor.getFullName());

        return mapper.toMedicalRecordResponse(saved);
    }

    @Override
    @Transactional
    public MedicalRecordResponse updateMedicalRecord(Long id, MedicalRecordRequest request, UserPrincipal currentUser) {
        enforceMedicalAccess(currentUser);

        MedicalRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + id));

        // If DOCTOR, verify author
        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = resolveDoctor(currentUser);
            if (!record.getDoctor().getId().equals(doctor.getId())) {
                throw new ForbiddenException("You are only permitted to edit medical records created under your own care.");
            }
        }

        record.setVisitDate(request.getVisitDate());
        record.setChiefComplaint(request.getChiefComplaint().trim());
        record.setClinicalNotes(request.getClinicalNotes().trim());
        record.setDiagnosis(request.getDiagnosis().trim());
        record.setTreatmentPlan(request.getTreatmentPlan().trim());
        record.setFollowUpDate(request.getFollowUpDate());

        record.getPrescriptions().clear();
        if (request.getPrescriptions() != null) {
            for (PrescriptionItemRequest item : request.getPrescriptions()) {
                PrescribedMedicine med = new PrescribedMedicine();
                med.setMedicineName(item.getMedicineName().trim());
                med.setDosage(item.getDosage().trim());
                med.setFrequency(item.getFrequency().trim());
                med.setDuration(item.getDuration().trim());
                med.setInstructions(item.getInstructions() != null ? item.getInstructions().trim() : null);
                record.addPrescription(med);
            }
        }

        MedicalRecord updated = recordRepository.save(record);

        auditLogService.logAction("MEDICAL_RECORD_UPDATED", "MedicalRecord", updated.getId(), currentUser.getUsername(),
                "Updated medical record id " + updated.getId());

        return mapper.toMedicalRecordResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponse getMedicalRecordById(Long id, UserPrincipal currentUser) {
        enforceMedicalAccess(currentUser);

        MedicalRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + id));

        return mapper.toMedicalRecordResponse(record);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<MedicalRecordResponse> getMedicalRecords(Long patientId, Long doctorId, LocalDate visitDate,
                                                                 String search, Pageable pageable, UserPrincipal currentUser) {
        enforceMedicalAccess(currentUser);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<MedicalRecord> page = recordRepository.findWithFilters(patientId, doctorId, visitDate, cleanSearch, pageable);

        List<MedicalRecordResponse> list = page.getContent().stream()
                .map(mapper::toMedicalRecordResponse)
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
    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getPatientMedicalRecords(Long patientId, UserPrincipal currentUser) {
        enforceMedicalAccess(currentUser);

        patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        return recordRepository.findByPatientIdOrderByVisitDateDesc(patientId).stream()
                .map(mapper::toMedicalRecordResponse)
                .collect(Collectors.toList());
    }

    private void enforceMedicalAccess(UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new ForbiddenException("Authentication required");
        }
        if (currentUser.getRole() == Role.RECEPTIONIST || currentUser.getRole() == Role.BILLING_STAFF) {
            throw new ForbiddenException("Receptionists and Billing staff are strictly restricted from accessing clinical medical records.");
        }
    }

    private Doctor resolveDoctor(UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.DOCTOR) {
            return doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + currentUser.getUsername()));
        }
        // If ADMIN creating on behalf, pick first available doctor or require doctor account
        List<Doctor> doctors = doctorRepository.findAll();
        if (doctors.isEmpty()) {
            throw new ResourceNotFoundException("No doctor registered in system to assign to medical record");
        }
        return doctors.get(0);
    }
}
