// src/components/SchoolLogo.tsx
import React from 'react';

interface SchoolLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 'small', // 调整默认尺寸为small，适配低分辨率
  className = ''
}) => {
  const sizeStyles = {
    small: 'w-12 md:w-16', // 小：移动端3rem，PC端4rem（更适配低分辨率）
    medium: 'w-16 md:w-20', // 中：移动端4rem，PC端5rem
    large: 'w-20 md:w-24' // 大：移动端5rem，PC端6rem
  };

  return (
    <img
      src="/assets/school-logo.png"
      alt="东北师范大学校徽"
      className={`${sizeStyles[size]} h-auto object-contain ${className}`}
    />
  );
};

export default SchoolLogo;