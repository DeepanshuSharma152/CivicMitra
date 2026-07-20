package com.example.CivicMitra.Config;

import com.example.CivicMitra.JWTAuth.JwtAuthenticationFilter;
import com.example.CivicMitra.Service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf-> csrf.disable())
                .authorizeHttpRequests(auth-> auth
                        .requestMatchers(
                                "/",
                                "/dashboard",
                                "/auth-home.css",
                                "/auth-home.js",
                                "/dashboard.css",
                                "/dashboard.js",
                                "/civicmitra.css",
                                "/civicmitra-refined.css",
                                "/civicmitra-reports.css",
                                "/civicmitra.js",
                                "/civicmitra-complaints.js",
                                "/images/**"
                        ).permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("AUTHORITY")
                        .requestMatchers("/api/v1/complaints/create").hasRole("CITIZEN")
                        .requestMatchers("/api/v1/segregation/**").authenticated()
                        .requestMatchers("/api/v1/households/**").authenticated()
                        .anyRequest().authenticated() // All other endpoints need a JWT
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                // ADD THE GUARD HERE: Run our JWT filter before the standard Username/Password filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}
