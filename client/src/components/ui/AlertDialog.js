import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import Button from "./Button";

export const AlertDialog = ({ children, open, onOpenChange }) => <Dialog open={open} onOpenChange={onOpenChange}>{children}</Dialog>;
export const AlertDialogTrigger = ({ children, asChild, onClick }) => <DialogTrigger asChild={asChild} onClick={onClick}>{children}</DialogTrigger>;
export const AlertDialogContent = ({ children, className }) => <DialogContent className={className}>{children}</DialogContent>; // Added className prop
export const AlertDialogHeader = ({ children, className }) => <div className={className}>{children}</div>; // Added className prop
export const AlertDialogTitle = ({ children, className }) => <DialogTitle className={className}>{children}</DialogTitle>; // Added className prop
export const AlertDialogDescription = ({ children, className }) => <DialogDescription className={className}>{children}</DialogDescription>; // Added className prop
export const AlertDialogFooter = ({ children, className }) => <DialogFooter className={className}>{children}</DialogFooter>; // Added className prop
export const AlertDialogCancel = ({ children, ...props }) => <Button variant="ghost" {...props}>{children}</Button>;
export const AlertDialogAction = ({ children, ...props }) => <Button {...props}>{children}</Button>;
