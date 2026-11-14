package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.DoctorRequest;
import com.medicare.hms.dto.request.DoctorScheduleRequest;
import com.medicare.hms.dto.response.DoctorResponse;
import com.medicare.hms.dto.response.DoctorScheduleResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.exception.BadRequestException;
import com.medicare.hms.exception.ConflictException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.DoctorService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository scheduleRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;

    public DoctorServiceImpl(DoctorRepository doctorRepository,
                             DoctorScheduleRepository scheduleRepository,
                             DepartmentRepository departmentRepository,
                             UserRepository userRepository,
                             AppointmentRepository appointmentRepository,
                             EntityDtoMapper mapper,
                             AuditLogService auditLogService) {
        this.doctorRepository = doctorRepository;
        this.scheduleRepository = scheduleRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request, String performedBy) {
        doctorRepository.findByEmail(request.getEmail().trim().toLowerCase()).ifPresent(d -> {
            throw new ConflictException("Doctor with email '" + request.getEmail() + "' already exists");
        });

        Doctor doctor = new Doctor();
        doctor.setFullName(request.getFullName().trim());
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setQualifications(request.getQualifications().trim());
        doctor.setPhone(request.getPhone().trim());
        doctor.setEmail(request.getEmail().trim().toLowerCase());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setYearsOfExperience(request.getYearsOfExperience());
        doctor.setAvailable(request.getAvailable() == null || request.getAvailable());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
            doctor.setDepartment(department);
        }

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
            doctor.setUser(user);
        }

        Doctor saved = doctorRepository.save(doctor);

        // Seed default weekday schedules (Mon-Fri 09:00 - 17:00) if none provided
        createDefaultSchedules(saved);

        auditLogService.logAction("DOCTOR_CREATED", "Doctor", saved.getId(), performedBy,
                "Added doctor " + saved.getFullName() + " (" + saved.getSpecialization() + ")");

        return mapper.toDoctorResponse(saved);
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request, String performedBy) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        doctor.setFullName(request.getFullName().trim());
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setQualifications(request.getQualifications().trim());
        doctor.setPhone(request.getPhone().trim());
        doctor.setEmail(request.getEmail().trim().toLowerCase());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setYearsOfExperience(request.getYearsOfExperience());
        if (request.getAvailable() != null) {
            doctor.setAvailable(request.getAvailable());
        }

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
            doctor.setDepartment(department);
        }

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
            doctor.setUser(user);
        }

        Doctor updated = doctorRepository.save(doctor);

        auditLogService.logAction("DOCTOR_UPDATED", "Doctor", updated.getId(), performedBy,
                "Updated details for doctor " + updated.getFullName());

        return mapper.toDoctorResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return mapper.toDoctorResponse(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user id: " + userId));
        return mapper.toDoctorResponse(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DoctorResponse> getDoctors(String search, Long departmentId, Boolean available, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Doctor> page = doctorRepository.findWithFilters(cleanSearch, departmentId, available, pageable);

        List<DoctorResponse> list = page.getContent().stream()
                .map(mapper::toDoctorResponse)
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
    public DoctorScheduleResponse addOrUpdateSchedule(Long doctorId, DoctorScheduleRequest request, String performedBy) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        Optional<DoctorSchedule> existing = scheduleRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(doctorId, request.getDayOfWeek());

        DoctorSchedule schedule;
        if (existing.isPresent()) {
            schedule = existing.get();
            schedule.setStartTime(request.getStartTime());
            schedule.setEndTime(request.getEndTime());
            schedule.setSlotDurationMinutes(request.getSlotDurationMinutes() > 0 ? request.getSlotDurationMinutes() : 30);
            schedule.setActive(request.getActive() == null || request.getActive());
        } else {
            schedule = new DoctorSchedule();
            schedule.setDoctor(doctor);
            schedule.setDayOfWeek(request.getDayOfWeek());
            schedule.setStartTime(request.getStartTime());
            schedule.setEndTime(request.getEndTime());
            schedule.setSlotDurationMinutes(request.getSlotDurationMinutes() > 0 ? request.getSlotDurationMinutes() : 30);
            schedule.setActive(request.getActive() == null || request.getActive());
        }

        DoctorSchedule saved = scheduleRepository.save(schedule);

        auditLogService.logAction("SCHEDULE_UPDATED", "DoctorSchedule", saved.getId(), performedBy,
                "Updated schedule for doctor " + doctor.getFullName() + " on " + request.getDayOfWeek());

        return mapper.toDoctorScheduleResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getDoctorSchedules(Long doctorId) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        return scheduleRepository.findByDoctorId(doctorId).stream()
                .map(mapper::toDoctorScheduleResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalTime> getDoctorAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        if (!doctor.isAvailable()) {
            return Collections.emptyList();
        }

        DayOfWeek dow = date.getDayOfWeek();
        Optional<DoctorSchedule> scheduleOpt = scheduleRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(doctorId, dow);

        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(17, 0);
        int slotMinutes = 30;

        if (scheduleOpt.isPresent()) {
            DoctorSchedule schedule = scheduleOpt.get();
            startTime = schedule.getStartTime();
            endTime = schedule.getEndTime();
            slotMinutes = schedule.getSlotDurationMinutes() > 0 ? schedule.getSlotDurationMinutes() : 30;
        }

        List<Appointment> existingAppointments = appointmentRepository.findConflictingAppointments(
                doctorId,
                date,
                startTime,
                endTime,
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW),
                null
        );

        List<LocalTime> availableSlots = new ArrayList<>();
        LocalTime current = startTime;
        LocalTime now = LocalTime.now();
        boolean isToday = date.equals(LocalDate.now());

        while (!current.plusMinutes(slotMinutes).isAfter(endTime)) {
            LocalTime slotStart = current;
            LocalTime slotEnd = current.plusMinutes(slotMinutes);

            // If booking for today, omit past slots
            if (!isToday || slotStart.isAfter(now)) {
                boolean overlaps = existingAppointments.stream().anyMatch(a ->
                        a.getStartTime().isBefore(slotEnd) && a.getEndTime().isAfter(slotStart)
                );
                if (!overlaps) {
                    availableSlots.add(slotStart);
                }
            }

            current = current.plusMinutes(slotMinutes);
        }

        return availableSlots;
    }

    @Override
    @Transactional
    public DoctorResponse setDoctorAvailability(Long id, boolean available, String performedBy) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        doctor.setAvailable(available);
        Doctor updated = doctorRepository.save(doctor);

        auditLogService.logAction("DOCTOR_AVAILABILITY_CHANGED", "Doctor", updated.getId(), performedBy,
                "Changed availability to " + available + " for doctor " + updated.getFullName());

        return mapper.toDoctorResponse(updated);
    }

    private void createDefaultSchedules(Doctor doctor) {
        for (DayOfWeek day : DayOfWeek.values()) {
            DoctorSchedule schedule = new DoctorSchedule(
                    null,
                    doctor,
                    day,
                    LocalTime.of(9, 0),
                    LocalTime.of(17, 0),
                    30,
                    true
            );
            scheduleRepository.save(schedule);
        }
    }
}
