import type { SVGAttributes } from 'react';
import { motion } from 'framer-motion';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            className="inline-flex"
        >
            <img 
                src="/csav-logo.svg" 
                alt="CSAV Logo"
                {...props}
                className={props.className}
            />
        </motion.div>
    );
}