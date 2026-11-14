package com.medicare.hms.service;

import com.medicare.hms.dto.request.AppointmentBookingRequest;
import com.medicare.hms.dto.request.AppointmentCancelRequest;
import com.medicare.hms.dto.response.AppointmentResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.exception.BadRequestException;
import com.medicare.hms.exception.ConflictException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DoctorScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Spy
    private EntityDtoMapper mapper = new EntityDtoMapper();

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private Patient samplePatient;
    private Doctor sampleDoctor;
    private DoctorSchedule sampleSchedule;
    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        samplePatient = new Patient(1L, "MED-2026-0001", "Eleanor Vance", LocalDate.of(1985, 4, 12),
                "FEMALE", "+15559012345", "eleanor@example.com", "Address", "Contact", "+15559012346", "O+", true);

        sampleDoctor = new Doctor(1L, null, "Dr. Robert Chen", "Cardiology", "MD", "+15552345678",
                "robert@medicare.com", null, BigDecimal.valueOf(750.00), 10, true);

        sampleSchedule = new DoctorSchedule(1L, sampleDoctor, DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(17, 0), 30, true);

        testPrincipal = new UserPrincipal(1L, "receptionist", "pass", "recep@medicare.com", "Receptionist", Role.RECEPTIONIST, true);
    }

    @Test
    void testBookAppointment_Success() {
        LocalDate futureMonday = LocalDate.now().plusWeeks(1);
        while (futureMonday.getDayOfWeek() != DayOfWeek.MONDAY) {
            futureMonday = futureMonday.plusDays(1);
        }

        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(futureMonday);
        request.setStartTime(LocalTime.of(10, 0));
        request.setDurationMinutes(30);
        request.setReasonForVisit("Routine heart consultation");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(scheduleRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(1L, DayOfWeek.MONDAY)).thenReturn(Optional.of(sampleSchedule));
        when(appointmentRepository.findConflictingAppointments(eq(1L), eq(futureMonday), eq(LocalTime.of(10, 0)), eq(LocalTime.of(10, 30)), anyCollection(), isNull()))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.count()).thenReturn(0L);
        when(appointmentRepository.existsByAppointmentReference(anyString())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment a = invocation.getArgument(0);
            a.setId(10L);
            return a;
        });

        AppointmentResponse response = appointmentService.bookAppointment(request, testPrincipal);

        assertNotNull(response);
        assertEquals(AppointmentStatus.SCHEDULED, response.getStatus());
        assertEquals("Dr. Robert Chen", response.getDoctorName());
        assertEquals("Eleanor Vance", response.getPatientName());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void testBookAppointment_FallbackWhenNoExplicitSchedule() {
        LocalDate futureSunday = LocalDate.now().plusWeeks(1);
        while (futureSunday.getDayOfWeek() != DayOfWeek.SUNDAY) {
            futureSunday = futureSunday.plusDays(1);
        }

        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(futureSunday);
        request.setStartTime(LocalTime.of(11, 0));
        request.setDurationMinutes(30);
        request.setReasonForVisit("Sunday emergency consultation");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        // No explicit schedule configured for Sunday - should fallback to default 09:00-17:00
        when(scheduleRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(1L, DayOfWeek.SUNDAY)).thenReturn(Optional.empty());
        when(appointmentRepository.findConflictingAppointments(eq(1L), eq(futureSunday), eq(LocalTime.of(11, 0)), eq(LocalTime.of(11, 30)), anyCollection(), isNull()))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.count()).thenReturn(0L);
        when(appointmentRepository.existsByAppointmentReference(anyString())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment a = invocation.getArgument(0);
            a.setId(11L);
            return a;
        });

        AppointmentResponse response = appointmentService.bookAppointment(request, testPrincipal);

        assertNotNull(response);
        assertEquals(AppointmentStatus.SCHEDULED, response.getStatus());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void testBookAppointment_ConflictRejected() {
        LocalDate futureMonday = LocalDate.now().plusWeeks(1);
        while (futureMonday.getDayOfWeek() != DayOfWeek.MONDAY) {
            futureMonday = futureMonday.plusDays(1);
        }

        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(futureMonday);
        request.setStartTime(LocalTime.of(10, 0));
        request.setDurationMinutes(30);
        request.setReasonForVisit("Cardiac consultation");

        Appointment existingConflict = new Appointment();
        existingConflict.setAppointmentReference("APT-2026-9999");
        existingConflict.setStartTime(LocalTime.of(10, 0));
        existingConflict.setEndTime(LocalTime.of(10, 30));
        existingConflict.setStatus(AppointmentStatus.SCHEDULED);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(scheduleRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(1L, DayOfWeek.MONDAY)).thenReturn(Optional.of(sampleSchedule));
        when(appointmentRepository.findConflictingAppointments(eq(1L), eq(futureMonday), eq(LocalTime.of(10, 0)), eq(LocalTime.of(10, 30)), anyCollection(), isNull()))
                .thenReturn(List.of(existingConflict));

        assertThrows(ConflictException.class, () -> appointmentService.bookAppointment(request, testPrincipal));
    }

    @Test
    void testBookAppointment_PastDateRejected() {
        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(LocalDate.now().minusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setDurationMinutes(30);
        request.setReasonForVisit("Past visit");

        assertThrows(BadRequestException.class, () -> appointmentService.bookAppointment(request, testPrincipal));
    }

    @Test
    void testCancelAppointment_Success() {
        Appointment apt = new Appointment();
        apt.setId(5L);
        apt.setAppointmentReference("APT-2026-0005");
        apt.setPatient(samplePatient);
        apt.setDoctor(sampleDoctor);
        apt.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepository.findById(5L)).thenReturn(Optional.of(apt));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentCancelRequest cancelReq = new AppointmentCancelRequest("Patient cannot attend due to travel");
        AppointmentResponse response = appointmentService.cancelAppointment(5L, cancelReq, testPrincipal);

        assertNotNull(response);
        assertEquals(AppointmentStatus.CANCELLED, response.getStatus());
        assertEquals("Patient cannot attend due to travel", response.getCancellationReason());
    }
}
