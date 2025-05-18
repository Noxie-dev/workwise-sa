import React from "react";

const Label = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>{children}</label>;

export default Label;
