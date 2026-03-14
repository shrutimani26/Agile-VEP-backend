import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserRole } from "../types";
import { UserContext } from "@/context/AuthProvider";

interface Props {
    role: UserRole;
    children: React.ReactNode;
}

const RequireRole: React.FC<Props> = ({ role, children }) => {
    const { user } = useContext(UserContext);

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RequireRole;
