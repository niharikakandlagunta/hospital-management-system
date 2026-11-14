package com.medicare.hms.controller;

import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AuditLogResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "Admin-only endpoints for reviewing system audit trails")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Get paginated audit trail logs (ADMIN only)")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PagedResponse<AuditLogResponse> response = auditLogService.getAllLogs(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
