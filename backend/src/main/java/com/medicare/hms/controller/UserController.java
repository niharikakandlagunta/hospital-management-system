package com.medicare.hms.controller;

import com.medicare.hms.dto.request.RegisterUserRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.UserSummaryResponse;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Management", description = "Admin-only endpoints for user creation, roles, and status management")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @Operation(summary = "Create a new user account with specified role (ADMIN only)")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> createUser(
            @Valid @RequestBody RegisterUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserSummaryResponse response = userService.createUser(request, principal != null ? principal.getUsername() : "ADMIN");
        return new ResponseEntity<>(ApiResponse.success("User created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List all registered users with pagination (ADMIN only)")
    public ResponseEntity<ApiResponse<PagedResponse<UserSummaryResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<UserSummaryResponse> response = userService.getAllUsers(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID (ADMIN only)")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getUserById(@PathVariable Long id) {
        UserSummaryResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Toggle user active/inactive status (ADMIN only)")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserSummaryResponse response = userService.toggleUserStatus(id, principal != null ? principal.getUsername() : "ADMIN");
        return ResponseEntity.ok(ApiResponse.success("User status updated", response));
    }
}
