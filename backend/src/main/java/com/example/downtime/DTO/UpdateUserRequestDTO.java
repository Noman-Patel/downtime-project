package com.example.downtime.DTO;

import com.example.downtime.Entities.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequestDTO(
        @NotBlank(message = "Display name is required")
        @Size(max = 120, message = "Display name must be 120 characters or fewer")
        String displayName,

        @NotNull(message = "Role is required")
        Role role,

        @NotNull(message = "Enabled status is required")
        Boolean enabled,

        String password
) {
}
