import React from 'react';

const createLucideIcon = (iconName: string) => {
  const Icon = ({ className, ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
    <svg data-testid={`${iconName.toLowerCase()}-icon`} className={className || ''} {...props} />
  );
  Icon.displayName = iconName;
  return Icon;
};

// Export all icons used in the application
export const MapPin = createLucideIcon('MapPin');
export const DollarSign = createLucideIcon('DollarSign');
export const Calendar = createLucideIcon('Calendar');
export const Check = createLucideIcon('Check');
export const Info = createLucideIcon('Info');
export const Sparkles = createLucideIcon('Sparkles');
export const PlusCircle = createLucideIcon('PlusCircle');
export const ImageIcon = createLucideIcon('ImageIcon');
export const X = createLucideIcon('X');
export const Loader2 = createLucideIcon('Loader2');
export const Save = createLucideIcon('Save');
export const Briefcase = createLucideIcon('Briefcase');
export const Building = createLucideIcon('Building');
export const UserCircle = createLucideIcon('UserCircle');
export const LinkIcon = createLucideIcon('LinkIcon');
export const Phone = createLucideIcon('Phone');
export const Eye = createLucideIcon('Eye');
export const Edit3 = createLucideIcon('Edit3');
export const Trash2 = createLucideIcon('Trash2');
export const ArrowLeft = createLucideIcon('ArrowLeft');
export const ArrowRight = createLucideIcon('ArrowRight');
export const ChevronDown = createLucideIcon('ChevronDown');
export const ChevronUp = createLucideIcon('ChevronUp');
export const ChevronLeft = createLucideIcon('ChevronLeft');
export const ChevronRight = createLucideIcon('ChevronRight');
export const Menu = createLucideIcon('Menu');
export const User = createLucideIcon('User');
export const LogOut = createLucideIcon('LogOut');
export const Settings = createLucideIcon('Settings');
export const Bell = createLucideIcon('Bell');
export const Search = createLucideIcon('Search');
export const Upload = createLucideIcon('Upload');
export const Download = createLucideIcon('Download');
export const Mail = createLucideIcon('Mail');
export const Home = createLucideIcon('Home');
export const FileText = createLucideIcon('FileText');
export const Dot = createLucideIcon('Dot');
export const MoreHorizontal = createLucideIcon('MoreHorizontal');
export const MoreVertical = createLucideIcon('MoreVertical');
export const Plus = createLucideIcon('Plus');
export const Minus = createLucideIcon('Minus');
export const ExternalLink = createLucideIcon('ExternalLink');
export const AlertCircle = createLucideIcon('AlertCircle');
export const AlertTriangle = createLucideIcon('AlertTriangle');
export const CheckCircle = createLucideIcon('CheckCircle');
export const XCircle = createLucideIcon('XCircle');
export const HelpCircle = createLucideIcon('HelpCircle');
export const Clock = createLucideIcon('Clock');
export const CalendarIcon = createLucideIcon('CalendarIcon');
export const Star = createLucideIcon('Star');
export const Heart = createLucideIcon('Heart');
export const Bookmark = createLucideIcon('Bookmark');
export const Share = createLucideIcon('Share');
export const Filter = createLucideIcon('Filter');
export const SortAsc = createLucideIcon('SortAsc');
export const SortDesc = createLucideIcon('SortDesc');
export const RefreshCw = createLucideIcon('RefreshCw');
export const Lock = createLucideIcon('Lock');
export const Unlock = createLucideIcon('Unlock');
export const Copy = createLucideIcon('Copy');
export const Clipboard = createLucideIcon('Clipboard');
export const Paperclip = createLucideIcon('Paperclip');
export const Send = createLucideIcon('Send');
export const MessageSquare = createLucideIcon('MessageSquare');
export const MessageCircle = createLucideIcon('MessageCircle');
export const Globe = createLucideIcon('Globe');
export const Flag = createLucideIcon('Flag');
export const Tag = createLucideIcon('Tag');
export const Layers = createLucideIcon('Layers');
export const Sliders = createLucideIcon('Sliders');
export const ToggleLeft = createLucideIcon('ToggleLeft');
export const ToggleRight = createLucideIcon('ToggleRight');
export const Zap = createLucideIcon('Zap');
export const Award = createLucideIcon('Award');
export const Cpu = createLucideIcon('Cpu');
export const Database = createLucideIcon('Database');
export const Server = createLucideIcon('Server');
export const Cloud = createLucideIcon('Cloud');
export const Monitor = createLucideIcon('Monitor');
export const Smartphone = createLucideIcon('Smartphone');
export const Tablet = createLucideIcon('Tablet');
export const Laptop = createLucideIcon('Laptop');
export const Printer = createLucideIcon('Printer');
export const Camera = createLucideIcon('Camera');
export const Video = createLucideIcon('Video');
export const Music = createLucideIcon('Music');
export const Film = createLucideIcon('Film');
export const Image = createLucideIcon('Image');
export const File = createLucideIcon('File');
export const Folder = createLucideIcon('Folder');
export const Archive = createLucideIcon('Archive');
export const Trash = createLucideIcon('Trash');
export const ShoppingCart = createLucideIcon('ShoppingCart');
export const ShoppingBag = createLucideIcon('ShoppingBag');
export const Package = createLucideIcon('Package');
export const Gift = createLucideIcon('Gift');
export const CreditCard = createLucideIcon('CreditCard');
export const Dollar = createLucideIcon('Dollar');
export const Percent = createLucideIcon('Percent');
export const TrendingUp = createLucideIcon('TrendingUp');
export const TrendingDown = createLucideIcon('TrendingDown');
export const BarChart = createLucideIcon('BarChart');
export const PieChart = createLucideIcon('PieChart');
export const LineChart = createLucideIcon('LineChart');
export const Activity = createLucideIcon('Activity');
export const Github = createLucideIcon('Github');
export const Gitlab = createLucideIcon('Gitlab');
export const Twitter = createLucideIcon('Twitter');
export const Facebook = createLucideIcon('Facebook');
export const Instagram = createLucideIcon('Instagram');
export const Linkedin = createLucideIcon('Linkedin');
export const Youtube = createLucideIcon('Youtube');
export const Figma = createLucideIcon('Figma');
export const Framer = createLucideIcon('Framer');
export const Dribbble = createLucideIcon('Dribbble');
export const Behance = createLucideIcon('Behance');
export const Slack = createLucideIcon('Slack');
export const Discord = createLucideIcon('Discord');
export const Twitch = createLucideIcon('Twitch');
export const Codepen = createLucideIcon('Codepen');
export const Codesandbox = createLucideIcon('Codesandbox');
export const Chrome = createLucideIcon('Chrome');
export const Firefox = createLucideIcon('Firefox');
export const Safari = createLucideIcon('Safari');
export const Edge = createLucideIcon('Edge');
export const Ie = createLucideIcon('Ie');
export const Opera = createLucideIcon('Opera');
export const Wifi = createLucideIcon('Wifi');
export const Bluetooth = createLucideIcon('Bluetooth');
export const Battery = createLucideIcon('Battery');
export const Power = createLucideIcon('Power');
export const Sun = createLucideIcon('Sun');
export const Moon = createLucideIcon('Moon');
export const Sunrise = createLucideIcon('Sunrise');
export const Sunset = createLucideIcon('Sunset');
export const CloudRain = createLucideIcon('CloudRain');
export const CloudSnow = createLucideIcon('CloudSnow');
export const CloudLightning = createLucideIcon('CloudLightning');
export const CloudDrizzle = createLucideIcon('CloudDrizzle');
export const Thermometer = createLucideIcon('Thermometer');
export const Umbrella = createLucideIcon('Umbrella');
export const Wind = createLucideIcon('Wind');
export const Compass = createLucideIcon('Compass');
export const Map = createLucideIcon('Map');
export const Navigation = createLucideIcon('Navigation');
export const Navigation2 = createLucideIcon('Navigation2');
export const Crosshair = createLucideIcon('Crosshair');
export const Target = createLucideIcon('Target');
export const Locate = createLucideIcon('Locate');
export const LocateFixed = createLucideIcon('LocateFixed');
export const LocateOff = createLucideIcon('LocateOff');
export const Mic = createLucideIcon('Mic');
export const MicOff = createLucideIcon('MicOff');
export const Volume = createLucideIcon('Volume');
export const Volume1 = createLucideIcon('Volume1');
export const Volume2 = createLucideIcon('Volume2');
export const VolumeX = createLucideIcon('VolumeX');
export const Play = createLucideIcon('Play');
export const Pause = createLucideIcon('Pause');
export const Stop = createLucideIcon('Stop');
export const SkipBack = createLucideIcon('SkipBack');
export const SkipForward = createLucideIcon('SkipForward');
export const Rewind = createLucideIcon('Rewind');
export const FastForward = createLucideIcon('FastForward');
export const Shuffle = createLucideIcon('Shuffle');
export const Repeat = createLucideIcon('Repeat');
export const List = createLucideIcon('List');
export const ListOrdered = createLucideIcon('ListOrdered');
export const AlignLeft = createLucideIcon('AlignLeft');
export const AlignCenter = createLucideIcon('AlignCenter');
export const AlignRight = createLucideIcon('AlignRight');
export const AlignJustify = createLucideIcon('AlignJustify');
export const Bold = createLucideIcon('Bold');
export const Italic = createLucideIcon('Italic');
export const Underline = createLucideIcon('Underline');
export const Link = createLucideIcon('Link');
export const Link2 = createLucideIcon('Link2');
export const Attachment = createLucideIcon('Attachment');
export const Photo = createLucideIcon('Photo');
export const CameraIcon = createLucideIcon('CameraIcon');
export const VideoIcon = createLucideIcon('VideoIcon');
export const MusicIcon = createLucideIcon('MusicIcon');
export const FilmIcon = createLucideIcon('FilmIcon');
export const FileIcon = createLucideIcon('FileIcon');
export const FileTextIcon = createLucideIcon('FileTextIcon');
export const FolderIcon = createLucideIcon('FolderIcon');
export const ArchiveIcon = createLucideIcon('ArchiveIcon');
export const TrashIcon = createLucideIcon('TrashIcon');
export const ShoppingCartIcon = createLucideIcon('ShoppingCartIcon');
export const ShoppingBagIcon = createLucideIcon('ShoppingBagIcon');
export const PackageIcon = createLucideIcon('PackageIcon');
export const GiftIcon = createLucideIcon('GiftIcon');
export const CreditCardIcon = createLucideIcon('CreditCardIcon');
export const DollarIcon = createLucideIcon('DollarIcon');
export const PercentIcon = createLucideIcon('PercentIcon');
export const TrendingUpIcon = createLucideIcon('TrendingUpIcon');
export const TrendingDownIcon = createLucideIcon('TrendingDownIcon');
export const BarChartIcon = createLucideIcon('BarChartIcon');
export const PieChartIcon = createLucideIcon('PieChartIcon');
export const LineChartIcon = createLucideIcon('LineChartIcon');
export const ActivityIcon = createLucideIcon('ActivityIcon');
