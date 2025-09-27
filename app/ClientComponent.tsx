// app/ClientComponent.tsx
"use client";
import { useAuth, useAuthUser, useLoginWithRedirect, useAuthActions } from "@frontegg/nextjs"; //, useLoginWithRedirect for Hosted 
import { AdminPortal } from "@frontegg/nextjs";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const ClientComponent = ({ baseUrl }: { baseUrl?: string }) => {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    // For Embedded login redirect
    // const user = useAuthUser()

    //For Hosted login redirect without middleware.ts
    // const loginWithRedirect = useLoginWithRedirect();

    const logout = useCallback(() => {
        router.replace('/account/logout');
    }, [router]);

    const handleClick = () => {
        AdminPortal.show();
    };

    return (
        <div className="App">
            {isAuthenticated ? (
                <div>
                    <div>
                        {/* @ts-ignore */}
                        <img src={user?.profilePictureUrl} alt={user?.name} />
                    </div>
                    <div>
                        <span>Logged in as: {user?.name}</span>
                    </div>
                    <div>
                        <button onClick={() => alert(user?.accessToken)}>
                            What is my access token?
                        </button>
                    </div>
                    <div>
                        <button onClick={() => logout()}>Click to logout</button>
                    </div>
                    <div>
                        <button onClick={handleClick}>Settings</button>
                    </div>
                </div>
            ) : (

                <></>

                // <button onClick={() => loginWithRedirect()}>
                // Click me to login
                // </button>

            )}
        </div>
    );

};