package com.example.CivicMitra.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths; // <-- REQUIRED IMPORT

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allow all paths
                        .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // This forces the exact absolute path WITH a guaranteed trailing slash
                // so Windows and Spring Boot cannot get confused.
                String uploadPath = "file:" + System.getProperty("user.dir") + "/uploads/";
                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations(uploadPath);
            }
        };
    }
}
