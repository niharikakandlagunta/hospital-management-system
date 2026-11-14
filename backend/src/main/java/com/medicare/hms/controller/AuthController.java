package com.medicare.hms.controller;

import com.medicare.hms.dto.request.LoginRequest;
import com.medicare.hms.dto.request.RegisterUserRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AuthResponse;
import com.medicare.hms.dto.response.UserSummaryResponse;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, current user profile, and session termination")
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLogService;

    public AuthController(AuthService authService, AuditLogService auditLogService) {
        this.authService = authService;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username and password to obtain JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account and obtain JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterUserRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(ApiResponse.success("Account created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserSummaryResponse response = authService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout the current user session")
    public ResponseEntity<ApiResponse<String>> logout(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null) {
            auditLogService.logAction("USER_LOGOUT", "User", principal.getId(), principal.getUsername(), "User logged out");
        }
        return ResponseEntity.ok(ApiResponse.success("Logout successful. Client session terminated.", null));
    }
}
