package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.AppointmentBookingRequest;
import com.medicare.hms.dto.request.AppointmentCancelRequest;
import com.medicare.hms.dto.request.AppointmentRescheduleRequest;
import com.medicare.hms.dto.response.AppointmentResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.exception.BadRequestException;
import com.medicare.hms.exception.ConflictException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AppointmentService;
import com.medicare.hms.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  PatientRepository patientRepository,
                                  DoctorRepository doctorRepository,
                                  DoctorScheduleRepository scheduleRepository,
                                  UserRepository userRepository,
                                  EntityDtoMapper mapper,
                                  AuditLogService auditLogService) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(AppointmentBookingRequest request, UserPrincipal currentUser) {
        // 1. Validate date & time not in past
        validateNotPast(request.getAppointmentDate(), request.getStartTime());

        // 2. Validate patient exists and is active
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));
        if (!patient.isActive()) {
            throw new BadRequestException("Cannot book appointment for an inactive patient. Please activate the patient first.");
        }

        // 3. Validate doctor exists and is available
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getDoctorId()));
        if (!doctor.isAvailable()) {
            throw new BadRequestException("Doctor " + doctor.getFullName() + " is currently marked as unavailable.");
        }

        // 4. Validate doctor schedule / working hours for the day of week
        int duration = request.getDurationMinutes() > 0 ? request.getDurationMinutes() : 30;
        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(duration);
        validateDoctorWorkingHours(doctor.getId(), request.getAppointmentDate().getDayOfWeek(), startTime, endTime);

        // 5. Conflict prevention (Overlap check with transactional lock)
        validateNoOverlap(doctor.getId(), request.getAppointmentDate(), startTime, endTime, null);

        // 6. Creator User reference
        User creator = null;
        if (currentUser != null) {
            creator = userRepository.findById(currentUser.getId()).orElse(null);
        }

        // 7. Persist Appointment
        String ref = generateAppointmentReference();
        Appointment appointment = new Appointment();
        appointment.setAppointmentReference(ref);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setDurationMinutes(duration);
        appointment.setReasonForVisit(request.getReasonForVisit().trim());
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setCreatedBy(creator);

        Appointment saved = appointmentRepository.save(appointment);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("APPOINTMENT_BOOKED", "Appointment", saved.getId(), performedBy,
                "Booked " + saved.getAppointmentReference() + " for patient " + patient.getFullName() + " with " + doctor.getFullName());

        return mapper.toAppointmentResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse rescheduleAppointment(Long id, AppointmentRescheduleRequest request, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Completed appointments cannot be rescheduled.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cancelled appointments cannot be rescheduled. Please book a new appointment.");
        }

        validateNotPast(request.getNewDate(), request.getNewStartTime());

        int duration = (request.getDurationMinutes() != null && request.getDurationMinutes() > 0)
                ? request.getDurationMinutes() : appointment.getDurationMinutes();
        LocalTime newStartTime = request.getNewStartTime();
        LocalTime newEndTime = newStartTime.plusMinutes(duration);

        validateDoctorWorkingHours(appointment.getDoctor().getId(), request.getNewDate().getDayOfWeek(), newStartTime, newEndTime);
        validateNoOverlap(appointment.getDoctor().getId(), request.getNewDate(), newStartTime, newEndTime, appointment.getId());

        appointment.setAppointmentDate(request.getNewDate());
        appointment.setStartTime(newStartTime);
        appointment.setEndTime(newEndTime);
        appointment.setDurationMinutes(duration);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment updated = appointmentRepository.save(appointment);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("APPOINTMENT_RESCHEDULED", "Appointment", updated.getId(), performedBy,
                "Rescheduled " + updated.getAppointmentReference() + " to " + updated.getAppointmentDate() + " " + updated.getStartTime());

        return mapper.toAppointmentResponse(updated);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long id, AppointmentCancelRequest request, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel an appointment that has already been completed.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Appointment is already cancelled.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(request.getReason().trim());

        Appointment updated = appointmentRepository.save(appointment);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("APPOINTMENT_CANCELLED", "Appointment", updated.getId(), performedBy,
                "Cancelled " + updated.getAppointmentReference() + ". Reason: " + request.getReason());

        return mapper.toAppointmentResponse(updated);
    }

    @Override
    @Transactional
    public AppointmentResponse completeAppointment(Long id, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot complete a cancelled appointment.");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment updated = appointmentRepository.save(appointment);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("APPOINTMENT_COMPLETED", "Appointment", updated.getId(), performedBy,
                "Marked " + updated.getAppointmentReference() + " as COMPLETED");

        return mapper.toAppointmentResponse(updated);
    }

    @Override
    @Transactional
    public AppointmentResponse markNoShow(Long id, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot mark a completed appointment as NO_SHOW.");
        }

        appointment.setStatus(AppointmentStatus.NO_SHOW);
        Appointment updated = appointmentRepository.save(appointment);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("APPOINTMENT_NO_SHOW", "Appointment", updated.getId(), performedBy,
                "Marked " + updated.getAppointmentReference() + " as NO_SHOW");

        return mapper.toAppointmentResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        return mapper.toAppointmentResponse(appointment);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AppointmentResponse> getAppointments(Long doctorId, Long patientId, AppointmentStatus status,
                                                              LocalDate startDate, LocalDate endDate, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Appointment> page = appointmentRepository.findWithFilters(doctorId, patientId, status, startDate, endDate, cleanSearch, pageable);

        List<AppointmentResponse> list = page.getContent().stream()
                .map(mapper::toAppointmentResponse)
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
    public List<AppointmentResponse> getTodayAppointments() {
        return appointmentRepository.findTodayAppointments(LocalDate.now()).stream()
                .map(mapper::toAppointmentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctorId).stream()
                .map(mapper::toAppointmentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patientId).stream()
                .map(mapper::toAppointmentResponse)
                .collect(Collectors.toList());
    }

    private void validateNotPast(LocalDate date, LocalTime time) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new BadRequestException("Appointment date cannot be in the past (" + date + ")");
        }
        if (date.isEqual(today) && time.isBefore(LocalTime.now())) {
            throw new BadRequestException("Appointment time cannot be in the past (" + time + ")");
        }
    }

    private void validateDoctorWorkingHours(Long doctorId, DayOfWeek dow, LocalTime startTime, LocalTime endTime) {
        Optional<DoctorSchedule> scheduleOpt = scheduleRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(doctorId, dow);
        LocalTime workStart = LocalTime.of(9, 0);
        LocalTime workEnd = LocalTime.of(17, 0);
        if (scheduleOpt.isPresent()) {
            DoctorSchedule schedule = scheduleOpt.get();
            workStart = schedule.getStartTime();
            workEnd = schedule.getEndTime();
        }
        if (startTime.isBefore(workStart) || endTime.isAfter(workEnd)) {
            throw new BadRequestException(String.format("Requested time slot (%s - %s) falls outside doctor working hours (%s - %s)",
                    startTime, endTime, workStart, workEnd));
        }
    }

    private void validateNoOverlap(Long doctorId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeAppointmentId) {
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                doctorId,
                date,
                startTime,
                endTime,
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW),
                excludeAppointmentId
        );

        if (!conflicts.isEmpty()) {
            Appointment conflict = conflicts.get(0);
            throw new ConflictException(String.format(
                    "Doctor already has an overlapping active appointment (%s: %s - %s). Please select an alternate slot.",
                    conflict.getAppointmentReference(), conflict.getStartTime(), conflict.getEndTime()
            ));
        }
    }

    private synchronized String generateAppointmentReference() {
        int year = LocalDate.now().getYear();
        long count = appointmentRepository.count() + 1;
        String candidate = String.format("APT-%d-%04d", year, count);
        int offset = 1;
        while (appointmentRepository.existsByAppointmentReference(candidate)) {
            candidate = String.format("APT-%d-%04d", year, count + offset);
            offset++;
        }
        return candidate;
    }
}
