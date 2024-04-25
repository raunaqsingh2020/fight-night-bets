import React from 'react';
import Image from "next/image"

export default function NavBar() {
    return (
        <div style={{ width: "100vw", padding: 16 }}>
            <Image
                src="/logo.svg"
                alt="logo"
                width={200}
                height={100}
            />
        </div>
    );
};