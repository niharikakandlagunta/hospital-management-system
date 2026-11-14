package com.medicare.hms.service;

import com.medicare.hms.dto.response.AuditLogResponse;
import com.medicare.hms.dto.response.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void logAction(String action, String entityName, Long entityId, String performedBy, String details);
    PagedResponse<AuditLogResponse> getAllLogs(Pageable pageable);
}
