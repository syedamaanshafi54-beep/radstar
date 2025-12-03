
import { SVGProps } from "react";

export const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="Instagram"
    {...props}
  >
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#f9ce34' }} />
        <stop offset="30%" style={{ stopColor: '#ee2a7b' }} />
        <stop offset="100%" style={{ stopColor: '#6228d7' }} />
      </linearGradient>
    </defs>
    <rect
      width="20"
      height="20"
      x="2"
      y="2"
      rx="5"
      ry="5"
      stroke="url(#instagram-gradient)"
    ></rect>
    <path
      d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
      stroke="url(#instagram-gradient)"
    ></path>
    <line
      x1="17.5"
      y1="6.5"
      x2="17.51"
      y2="6.5"
      stroke="url(#instagram-gradient)"
    ></line>
  </svg>
);

export const WhatsAppIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    strokeWidth="1"
    aria-label="WhatsApp"
    {...props}
  >
    <path
      fill="#25D366"
      d="M16.6,14.8l-1.9-0.9c-0.3-0.2-0.7-0.1-0.9,0.1l-0.7,0.7c-0.1,0.1-0.3,0.2-0.5,0.1c-0.7-0.3-1.4-0.7-2-1.2c-0.6-0.5-1.1-1.1-1.4-1.8c-0.1-0.2,0-0.4,0.1-0.5l0.7-0.7c0.2-0.2,0.3-0.6,0.1-0.9L8.8,7.6C8.6,7.3,8.2,7,7.8,7C7.4,7,7,7.1,6.7,7.3l-1,1C5.4,8.5,5.1,9,5.1,9.5c0,0.5,0.2,1,0.4,1.5c0.5,1.1,1.2,2.1,2.1,3c1,1,2,1.7,3.1,2.1c0.5,0.2,1,0.3,1.5,0.3c0.5,0,1-0.2,1.4-0.6l1-1c0.2-0.3,0.3-0.6,0.3-1C17.6,15.5,17.2,15,16.6,14.8z"
    />
     <path
      fill="#25D366"
      d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10c5.5,0,10-4.5,10-10S17.5,2,12,2z M12,20c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S16.4,20,12,20z"
    />
  </svg>
);


export const GoogleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 48 48" 
    width="48px" 
    height="48px"
    {...props}
    >
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.648-3.657-11.303-8.428l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C44.578,36.65,48,30.82,48,24C48,22.659,47.862,21.35,47.611,20.083z"/>
  </svg>
)
