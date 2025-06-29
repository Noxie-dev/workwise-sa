import { Helmet as HelmetAsync } from 'react-helmet-async';

interface CustomHelmetProps {
  title: string;
  description: string;
}

const CustomHelmet = ({ title, description }: CustomHelmetProps) => {
  return (
    <HelmetAsync>
      <title>{title}</title>
      <meta name="description" content={description} />
    </HelmetAsync>
  );
};

export default CustomHelmet;
