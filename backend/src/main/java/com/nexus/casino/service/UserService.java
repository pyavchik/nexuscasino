package com.nexus.casino.service;

import com.nexus.casino.dto.UserDto;
import com.nexus.casino.entity.User;
import com.nexus.casino.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_USER")
                .build();
    }

    public UserDto getUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .balance(user.getBalance())
                .build();
    }

    @Transactional
    public UserDto updateBalance(User user, BigDecimal amount) {
        user.setBalance(user.getBalance().add(amount));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return getUserDto(updatedUser);
    }

    public BigDecimal getBalance(User user) {
        return user.getBalance();
    }

    @Transactional
    public UserDto resetBalance(User user) {
        user.setBalance(BigDecimal.valueOf(1000.00));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return getUserDto(updatedUser);
    }
}

