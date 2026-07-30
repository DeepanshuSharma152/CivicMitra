package com.example.CivicMitra.Service;

import com.example.CivicMitra.Repository.WorkerRepository;
import com.example.CivicMitra.model.worker.Worker;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Spring Security UserDetailsService for the Worker entity.
 *
 * Workers do NOT have email addresses — they authenticate with workerCode + PIN.
 * This service is used by JwtAuthenticationFilter when the JWT subject starts with "W-",
 * which signals a worker token rather than a citizen token.
 *
 * The UserDetails returned uses:
 *   - username   = workerCode  (e.g. "W-CHA-001")
 *   - password   = pinHash     (BCrypt — never exposed, used only for internal validation)
 *   - authority  = "ROLE_WORKER_ENTITY"
 */
@Service
public class WorkerUserDetailsService implements UserDetailsService {

    private final WorkerRepository workerRepository;

    public WorkerUserDetailsService(WorkerRepository workerRepository) {
        this.workerRepository = workerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String workerCode) throws UsernameNotFoundException {
        Worker worker = workerRepository.findByWorkerCodeAndIsActiveTrue(workerCode)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No active worker found with code: " + workerCode));

        return new User(
                worker.getWorkerCode(),
                worker.getPinHash(),
                List.of(new SimpleGrantedAuthority("ROLE_WORKER_ENTITY"))
        );
    }
}
