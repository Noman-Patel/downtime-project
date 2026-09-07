package com.example.downtime.DTO;

import com.example.downtime.Entities.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequestDTO(
        @NotBlank(message = "Username is required")
        @Size(max = 80, message = "Username must be 80 characters or fewer")
        @Pattern(
                regexp = "^[A-Za-z0-9._-]+$",
                message = "Username can only contain letters, numbers, dots, underscores, and hyphens"
        )
        String username,

        @NotBlank(message = "Display name is required")
        @Size(max = 120, message = "Display name must be 120 characters or fewer")
        String displayName,

        @NotBlank(message = "Password is required")
        @Size(
                min = 8,
                max = 72,
                message = "Password must be between 8 and 72 characters"
        )
        String password,

        @NotNull(message = "Role is required")
        Role role
) {
}
