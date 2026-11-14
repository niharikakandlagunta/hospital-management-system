package com.medicare.hms.service;

import com.medicare.hms.dto.request.AppointmentBookingRequest;
import com.medicare.hms.dto.request.AppointmentCancelRequest;
import com.medicare.hms.dto.request.AppointmentRescheduleRequest;
import com.medicare.hms.dto.response.AppointmentResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.entity.AppointmentStatus;
import com.medicare.hms.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {
    AppointmentResponse bookAppointment(AppointmentBookingRequest request, UserPrincipal currentUser);
    AppointmentResponse rescheduleAppointment(Long id, AppointmentRescheduleRequest request, UserPrincipal currentUser);
    AppointmentResponse cancelAppointment(Long id, AppointmentCancelRequest request, UserPrincipal currentUser);
    AppointmentResponse completeAppointment(Long id, UserPrincipal currentUser);
    AppointmentResponse markNoShow(Long id, UserPrincipal currentUser);
    AppointmentResponse getAppointmentById(Long id);
    PagedResponse<AppointmentResponse> getAppointments(Long doctorId, Long patientId, AppointmentStatus status,
                                                      LocalDate startDate, LocalDate endDate, String search, Pageable pageable);
    List<AppointmentResponse> getTodayAppointments();
    List<AppointmentResponse> getDoctorAppointments(Long doctorId);
    List<AppointmentResponse> getPatientAppointments(Long patientId);
}
