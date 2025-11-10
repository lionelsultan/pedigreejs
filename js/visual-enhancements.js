'use strict';

/**
 * Enhanced Visual Effects for PedigreeJS
 */
(function initVisualEnhancements() {
    
    // SVG Gradients and Patterns
    function createSVGDefinitions(svg) {
        const defs = svg.append('defs');
        
        // Disease gradients
        const breastCancerGradient = defs.append('linearGradient')
            .attr('id', 'breastCancerGradient')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '100%');
        
        breastCancerGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#f59e0b')
            .attr('stop-opacity', 1);
        
        breastCancerGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#f97316')
            .attr('stop-opacity', 1);

        const ovarianCancerGradient = defs.append('linearGradient')
            .attr('id', 'ovarianCancerGradient')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '100%');
        
        ovarianCancerGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#10b981')
            .attr('stop-opacity', 1);
        
        ovarianCancerGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#059669')
            .attr('stop-opacity', 1);

        const prostateCancerGradient = defs.append('linearGradient')
            .attr('id', 'prostateCancerGradient')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '100%');
        
        prostateCancerGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#ef4444')
            .attr('stop-opacity', 1);
        
        prostateCancerGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#dc2626')
            .attr('stop-opacity', 1);

        // Glow filter
        const filter = defs.append('filter')
            .attr('id', 'glow');
        
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');
        
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Pattern for background
        const pattern = defs.append('pattern')
            .attr('id', 'gridPattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 40)
            .attr('height', 40);
        
        pattern.append('rect')
            .attr('width', 40)
            .attr('height', 40)
            .attr('fill', 'white')
            .attr('fill-opacity', 0.05);
        
        pattern.append('path')
            .attr('d', 'M 40 0 L 0 0 0 40')
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.1);
    }

    // Enhanced node styling
    function enhancePersonNodes() {
        if (typeof d3 === 'undefined') return;
        
        const svg = d3.select('#pedigree svg');
        if (svg.empty()) return;

        // Create definitions if they don't exist
        if (svg.select('defs').empty()) {
            createSVGDefinitions(svg);
        }

        // Style person nodes
        svg.selectAll('.person')
            .style('cursor', 'pointer')
            .style('transition', 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)')
            .on('mouseenter', function() {
                d3.select(this)
                    .style('filter', 'drop-shadow(0 4px 12px rgba(37, 99, 235, 0.4))')
                    .style('transform', 'scale(1.05)');
            })
            .on('mouseleave', function() {
                d3.select(this)
                    .style('filter', null)
                    .style('transform', null);
            });

        // Enhanced shapes
        svg.selectAll('.person rect, .person circle')
            .style('stroke-width', '2.5px')
            .style('stroke', '#2563eb')
            .style('fill', 'white')
            .style('transition', 'all 0.3s ease');

        // Apply disease colors with gradients
        svg.selectAll('.person')
            .each(function(d) {
                const node = d3.select(this);
                const shape = node.select('rect, circle');
                
                if (d.breast_cancer || d.breast_cancer_diagnosis_age) {
                    shape.style('fill', 'url(#breastCancerGradient)');
                } else if (d.ovarian_cancer || d.ovarian_cancer_diagnosis_age) {
                    shape.style('fill', 'url(#ovarianCancerGradient)');
                } else if (d.prostate_cancer || d.prostate_cancer_diagnosis_age) {
                    shape.style('fill', 'url(#prostateCancerGradient)');
                }
            });
    }

    // Particle effect for canvas background
    function createParticleEffect() {
        const canvas = document.querySelector('.pedigree-stage');
        if (!canvas) return;

        const particleContainer = document.createElement('div');
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;

        // Create floating particles
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, rgba(37, 99, 235, 0.6) 0%, rgba(37, 99, 235, 0) 70%);
                border-radius: 50%;
                animation: float-particle ${5 + Math.random() * 10}s infinite linear;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 5}s;
            `;
            particleContainer.appendChild(particle);
        }

        canvas.appendChild(particleContainer);
    }

    // Enhanced loading animations
    function addLoadingAnimation(element) {
        element.classList.add('loading');
        setTimeout(() => {
            element.classList.remove('loading');
        }, 1500);
    }

    // Interactive button effects
    function enhanceButtons() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });

            btn.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });

            btn.addEventListener('click', function() {
                // Ripple effect
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
                
                this.appendChild(ripple);
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // Enhanced cards hover effects
    function enhanceCards() {
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
    }

    // Typewriter effect for titles
    function typewriterEffect(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Progressive image loading effect
    function addImageLoadEffect() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.complete) {
                img.style.filter = 'blur(5px)';
                img.style.transition = 'filter 0.3s ease';
                
                img.addEventListener('load', function() {
                    this.style.filter = 'none';
                });
            }
        });
    }

    // Intersection Observer for scroll animations
    function addScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe sections
        document.querySelectorAll('section, .card, .phase-card').forEach(section => {
            section.classList.add('animate-ready');
            observer.observe(section);
        });
    }

    // Advanced tooltip positioning
    function enhanceTooltips() {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(trigger => {
            trigger.addEventListener('mouseenter', function() {
                const tooltip = this.getAttribute('title') || this.getAttribute('data-bs-original-title');
                if (tooltip) {
                    // Add visual enhancements to tooltip
                    setTimeout(() => {
                        const tooltipElement = document.querySelector('.tooltip');
                        if (tooltipElement) {
                            tooltipElement.style.backdropFilter = 'blur(10px)';
                            tooltipElement.style.borderRadius = '12px';
                            tooltipElement.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                        }
                    }, 10);
                }
            });
        });
    }

    // Performance monitoring visualization
    function createPerformanceVisualization() {
        const perfElement = document.getElementById('performance-info');
        if (perfElement) {
            perfElement.addEventListener('click', function() {
                // Create a mini performance chart
                const chart = document.createElement('div');
                chart.style.cssText = `
                    position: absolute;
                    top: -50px;
                    left: 0;
                    width: 200px;
                    height: 40px;
                    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    z-index: 1000;
                    animation: fadeInUp 0.3s ease;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                `;
                chart.textContent = 'Excellent Performance! ⚡';
                
                this.style.position = 'relative';
                this.appendChild(chart);
                
                setTimeout(() => {
                    chart.remove();
                }, 3000);
            });
        }
    }

    // Initialize all enhancements
    function initAllEnhancements() {
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to { transform: scale(4); opacity: 0; }
            }
            
            @keyframes float-particle {
                0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
                10%, 90% { opacity: 1; }
                50% { transform: translateY(-20px) rotate(180deg); }
            }
            
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .animate-ready {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
            }
            
            .animate-in {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);

        // Initialize all enhancements
        enhanceButtons();
        enhanceCards();
        addScrollAnimations();
        enhanceTooltips();
        createPerformanceVisualization();
        createParticleEffect();
        addImageLoadEffect();

        // Enhance pedigree nodes when they're available
        setTimeout(enhancePersonNodes, 1000);
        
        // Re-enhance on pedigree rebuilds
        document.addEventListener('rebuild', () => {
            setTimeout(enhancePersonNodes, 100);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllEnhancements);
    } else {
        initAllEnhancements();
    }
})();