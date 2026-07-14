package com.example.CivicMitra.Service;

import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.model.core.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

//tell spring security how to interact with my db
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

 //ss nu dsta deta v my usr is like this baki tu dekhla auth da
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("Searching for user: " + email);
        Optional<User> userOptional=userRepository.findByEmail(email);

        User user=userOptional.orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        String roleWithPrefix="ROLE_" + user.getRole().name();
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getHashedPassword())
                .authorities(roleWithPrefix)   // spring security nu ni pta apni user entity da thats why return a userdetails object
                .build();
    }
}
