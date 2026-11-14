package com.medicare.hms.service;

import com.medicare.hms.dto.request.RegisterUserRequest;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.UserSummaryResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserSummaryResponse createUser(RegisterUserRequest request, String createdBy);
    PagedResponse<UserSummaryResponse> getAllUsers(Pageable pageable);
    UserSummaryResponse getUserById(Long id);
    UserSummaryResponse toggleUserStatus(Long id, String performedBy);
}
