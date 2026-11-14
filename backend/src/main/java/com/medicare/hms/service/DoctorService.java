package com.medicare.hms.service;

import com.medicare.hms.dto.request.DoctorRequest;
import com.medicare.hms.dto.request.DoctorScheduleRequest;
import com.medicare.hms.dto.response.DoctorResponse;
import com.medicare.hms.dto.response.DoctorScheduleResponse;
import com.medicare.hms.dto.response.PagedResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface DoctorService {
    DoctorResponse createDoctor(DoctorRequest request, String performedBy);
    DoctorResponse updateDoctor(Long id, DoctorRequest request, String performedBy);
    DoctorResponse getDoctorById(Long id);
    DoctorResponse getDoctorByUserId(Long userId);
    PagedResponse<DoctorResponse> getDoctors(String search, Long departmentId, Boolean available, Pageable pageable);
    DoctorScheduleResponse addOrUpdateSchedule(Long doctorId, DoctorScheduleRequest request, String performedBy);
    List<DoctorScheduleResponse> getDoctorSchedules(Long doctorId);
    List<LocalTime> getDoctorAvailableSlots(Long doctorId, LocalDate date);
    DoctorResponse setDoctorAvailability(Long id, boolean available, String performedBy);
}
