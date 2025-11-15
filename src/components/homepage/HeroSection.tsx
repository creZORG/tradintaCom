
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const WELCOME_MESSAGES = [
  'Welcome to', // English
  'Karibu', // Swahili
  'Bienvenue à', // French
  'Benvenuti a', // Italian
  'أهلاً بكم في', // Arabic
];

export function HeroSection() {
    const [welcomeIndex, setWelcomeIndex] = React.useState(0);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setWelcomeIndex((prevIndex) => (prevIndex + 1) % WELCOME_MESSAGES.length);
                setIsAnimating(false);
            }, 700); 
        }, 3000); 

        return () => clearInterval(intervalId);
    }, []);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const particleColors = [
            'hsla(25, 95%, 53%, 0.8)', 
            'hsla(221, 83%, 53%, 0.8)' 
        ];

        let particles: any[];
        let animationFrameId: number;
        
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            canvas.style.width = `${canvas.offsetWidth}px`;
            canvas.style.height = `${canvas.offsetHeight}px`;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        const createParticles = () => {
            particles = [];
            const numberOfParticles = (canvas.offsetWidth * canvas.offsetHeight) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.offsetWidth,
                    y: Math.random() * canvas.offsetHeight,
                    directionX: (Math.random() * 0.4) - 0.2,
                    directionY: (Math.random() * 0.4) - 0.2,
                    size: (Math.random() * 2) + 1,
                    color: particleColors[Math.floor(Math.random() * particleColors.length)]
                });
            }
        };
        
        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                                 + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    if (distance < (canvas.offsetWidth/7) * (canvas.offsetHeight/7)) {
                        opacityValue = 1 - (distance/20000);
                        ctx.strokeStyle = particles[a].color.replace('0.8', `${opacityValue * 0.5}`); 
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                let particle = particles[i];
                particle.x += particle.directionX;
                particle.y += particle.directionY;
                
                if (particle.x > canvas.offsetWidth || particle.x < 0) particle.directionX = -particle.directionX;
                if (particle.y > canvas.offsetHeight || particle.y < 0) particle.directionY = -particle.directionY;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };
        
        resizeCanvas();
        createParticles();
        animate();

        const handleResize = () => {
            resizeCanvas();
            createParticles();
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const welcomeText = WELCOME_MESSAGES[welcomeIndex];

    return (
        <section className="relative h-[600px] w-full flex items-center justify-center bg-background overflow-hidden" style={{ isolation: 'isolate' }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 z-0"></canvas>
            <div className="text-center p-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 font-headline h-20 md:h-24 flex items-center justify-center flex-wrap">
                    <span className="inline-block mr-4">
                      <span key={welcomeIndex} className={isAnimating ? 'disintegrate-out' : 'disintegrate-in'}>
                          {welcomeText}
                      </span>
                    </span>
                    <span style={{ color: '#00529A' }}>
                      <span
                        style={{
                          background: 'linear-gradient(to right, #29ABE2, #00529A)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          textFillColor: 'transparent',
                        }}
                      >
                        T
                      </span>
                      radinta
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mb-8 animate-fade-in-up animation-delay-300">
                    Powering Africa’s manufacturers through digital trade, secure payments, and data-driven growth.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
                     <Button size="lg" asChild>
                        <Link href="/signup">Become a Verified Manufacturer</Link>
                    </Button>
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/products">Explore the Marketplace</Link>
                    </Button>
                </div>
            </div>
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out forwards;
                    opacity: 0;
                }
                .animation-delay-300 {
                    animation-delay: 0.3s;
                }
                .animation-delay-600 {
                    animation-delay: 0.6s;
                }
            `}</style>
        </section>
    );
}
