package com.medicare.hms.mapper;

import com.medicare.hms.dto.response.*;
import com.medicare.hms.entity.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class EntityDtoMapper {

    public UserSummaryResponse toUserSummary(User user) {
        if (user == null) return null;
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    public PatientResponse toPatientResponse(Patient patient) {
        if (patient == null) return null;
        PatientResponse dto = new PatientResponse();
        dto.setId(patient.getId());
        dto.setRegistrationNumber(patient.getRegistrationNumber());
        dto.setFullName(patient.getFullName());
        dto.setDateOfBirth(patient.getDateOfBirth());
        if (patient.getDateOfBirth() != null) {
            dto.setAge(Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears());
        }
        dto.setGender(patient.getGender());
        dto.setPhone(patient.getPhone());
        dto.setEmail(patient.getEmail());
        dto.setAddress(patient.getAddress());
        dto.setEmergencyContactName(patient.getEmergencyContactName());
        dto.setEmergencyContactPhone(patient.getEmergencyContactPhone());
        dto.setBloodGroup(patient.getBloodGroup());
        dto.setActive(patient.isActive());
        dto.setCreatedAt(patient.getCreatedAt());
        dto.setUpdatedAt(patient.getUpdatedAt());
        return dto;
    }

    public DoctorResponse toDoctorResponse(Doctor doctor) {
        if (doctor == null) return null;
        DoctorResponse dto = new DoctorResponse();
        dto.setId(doctor.getId());
        if (doctor.getUser() != null) {
            dto.setUserId(doctor.getUser().getId());
        }
        dto.setFullName(doctor.getFullName());
        dto.setSpecialization(doctor.getSpecialization());
        dto.setQualifications(doctor.getQualifications());
        dto.setPhone(doctor.getPhone());
        dto.setEmail(doctor.getEmail());
        if (doctor.getDepartment() != null) {
            dto.setDepartmentId(doctor.getDepartment().getId());
            dto.setDepartmentName(doctor.getDepartment().getName());
        }
        dto.setConsultationFee(doctor.getConsultationFee());
        dto.setYearsOfExperience(doctor.getYearsOfExperience());
        dto.setAvailable(doctor.isAvailable());
        if (doctor.getSchedules() != null) {
            dto.setSchedules(doctor.getSchedules().stream()
                    .map(this::toDoctorScheduleResponse)
                    .collect(Collectors.toList()));
        }
        dto.setCreatedAt(doctor.getCreatedAt());
        return dto;
    }

    public DoctorScheduleResponse toDoctorScheduleResponse(DoctorSchedule schedule) {
        if (schedule == null) return null;
        return new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctor() != null ? schedule.getDoctor().getId() : null,
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotDurationMinutes(),
                schedule.isActive()
        );
    }

    public AppointmentResponse toAppointmentResponse(Appointment appointment) {
        if (appointment == null) return null;
        AppointmentResponse dto = new AppointmentResponse();
        dto.setId(appointment.getId());
        dto.setAppointmentReference(appointment.getAppointmentReference());
        if (appointment.getPatient() != null) {
            dto.setPatientId(appointment.getPatient().getId());
            dto.setPatientName(appointment.getPatient().getFullName());
            dto.setPatientRegistrationNumber(appointment.getPatient().getRegistrationNumber());
            dto.setPatientPhone(appointment.getPatient().getPhone());
        }
        if (appointment.getDoctor() != null) {
            dto.setDoctorId(appointment.getDoctor().getId());
            dto.setDoctorName(appointment.getDoctor().getFullName());
            dto.setDoctorSpecialization(appointment.getDoctor().getSpecialization());
        }
        dto.setAppointmentDate(appointment.getAppointmentDate());
        dto.setStartTime(appointment.getStartTime());
        dto.setEndTime(appointment.getEndTime());
        dto.setDurationMinutes(appointment.getDurationMinutes());
        dto.setReasonForVisit(appointment.getReasonForVisit());
        dto.setStatus(appointment.getStatus());
        dto.setCancellationReason(appointment.getCancellationReason());
        if (appointment.getCreatedBy() != null) {
            dto.setCreatedByName(appointment.getCreatedBy().getFullName());
        }
        dto.setCreatedAt(appointment.getCreatedAt());
        dto.setUpdatedAt(appointment.getUpdatedAt());
        return dto;
    }

    public MedicalRecordResponse toMedicalRecordResponse(MedicalRecord record) {
        if (record == null) return null;
        MedicalRecordResponse dto = new MedicalRecordResponse();
        dto.setId(record.getId());
        if (record.getPatient() != null) {
            dto.setPatientId(record.getPatient().getId());
            dto.setPatientName(record.getPatient().getFullName());
            dto.setPatientRegistrationNumber(record.getPatient().getRegistrationNumber());
        }
        if (record.getDoctor() != null) {
            dto.setDoctorId(record.getDoctor().getId());
            dto.setDoctorName(record.getDoctor().getFullName());
            dto.setDoctorSpecialization(record.getDoctor().getSpecialization());
        }
        if (record.getAppointment() != null) {
            dto.setAppointmentId(record.getAppointment().getId());
            dto.setAppointmentReference(record.getAppointment().getAppointmentReference());
        }
        dto.setVisitDate(record.getVisitDate());
        dto.setChiefComplaint(record.getChiefComplaint());
        dto.setClinicalNotes(record.getClinicalNotes());
        dto.setDiagnosis(record.getDiagnosis());
        dto.setTreatmentPlan(record.getTreatmentPlan());
        dto.setFollowUpDate(record.getFollowUpDate());
        if (record.getPrescriptions() != null) {
            dto.setPrescriptions(record.getPrescriptions().stream()
                    .map(this::toPrescriptionResponse)
                    .collect(Collectors.toList()));
        } else {
            dto.setPrescriptions(Collections.emptyList());
        }
        dto.setCreatedAt(record.getCreatedAt());
        dto.setUpdatedAt(record.getUpdatedAt());
        return dto;
    }

    public PrescribedMedicineResponse toPrescriptionResponse(PrescribedMedicine med) {
        if (med == null) return null;
        return new PrescribedMedicineResponse(
                med.getId(),
                med.getMedicineName(),
                med.getDosage(),
                med.getFrequency(),
                med.getDuration(),
                med.getInstructions()
        );
    }

    public BillResponse toBillResponse(Bill bill) {
        if (bill == null) return null;
        BillResponse dto = new BillResponse();
        dto.setId(bill.getId());
        dto.setBillNumber(bill.getBillNumber());
        if (bill.getPatient() != null) {
            dto.setPatientId(bill.getPatient().getId());
            dto.setPatientName(bill.getPatient().getFullName());
            dto.setPatientRegistrationNumber(bill.getPatient().getRegistrationNumber());
            dto.setPatientPhone(bill.getPatient().getPhone());
        }
        if (bill.getAppointment() != null) {
            dto.setAppointmentId(bill.getAppointment().getId());
            dto.setAppointmentReference(bill.getAppointment().getAppointmentReference());
        }
        dto.setConsultationCharge(bill.getConsultationCharge());
        dto.setAdditionalCharges(bill.getAdditionalCharges());
        dto.setDiscount(bill.getDiscount());
        dto.setTaxRate(bill.getTaxRate());
        dto.setTaxAmount(bill.getTaxAmount());
        dto.setTotalAmount(bill.getTotalAmount());
        dto.setPaidAmount(bill.getPaidAmount());
        dto.setBalanceDue(bill.getBalanceDue());
        dto.setPaymentStatus(bill.getPaymentStatus());
        dto.setDueDate(bill.getDueDate());
        dto.setNotes(bill.getNotes());
        if (bill.getItems() != null) {
            dto.setItems(bill.getItems().stream()
                    .map(this::toBillItemResponse)
                    .collect(Collectors.toList()));
        }
        if (bill.getPayments() != null) {
            dto.setPayments(bill.getPayments().stream()
                    .map(this::toPaymentResponse)
                    .collect(Collectors.toList()));
        }
        dto.setCreatedAt(bill.getCreatedAt());
        dto.setUpdatedAt(bill.getUpdatedAt());
        return dto;
    }

    public BillItemResponse toBillItemResponse(BillItem item) {
        if (item == null) return null;
        return new BillItemResponse(
                item.getId(),
                item.getItemDescription(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice()
        );
    }

    public PaymentResponse toPaymentResponse(Payment payment) {
        if (payment == null) return null;
        PaymentResponse dto = new PaymentResponse();
        dto.setId(payment.getId());
        dto.setPaymentReference(payment.getPaymentReference());
        if (payment.getBill() != null) {
            dto.setBillId(payment.getBill().getId());
            dto.setBillNumber(payment.getBill().getBillNumber());
            if (payment.getBill().getPatient() != null) {
                dto.setPatientName(payment.getBill().getPatient().getFullName());
            }
        }
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setTransactionReference(payment.getTransactionReference());
        dto.setPaymentTimestamp(payment.getPaymentTimestamp());
        if (payment.getRecordedBy() != null) {
            dto.setRecordedByName(payment.getRecordedBy().getFullName());
        }
        dto.setStatus(payment.getStatus());
        dto.setNotes(payment.getNotes());
        return dto;
    }

    public AuditLogResponse toAuditLogResponse(AuditLog log) {
        if (log == null) return null;
        return new AuditLogResponse(
                log.getId(),
                log.getAction(),
                log.getEntityName(),
                log.getEntityId(),
                log.getPerformedBy(),
                log.getDetails(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }
}
