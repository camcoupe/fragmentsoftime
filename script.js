function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const PRELOAD_HERO_IMAGES = [
    'Grid Images/MVI_0113.00_00_02_29.Still001.jpg',
    'Grid Images/MVI_0189.00_00_11_18.Still002.jpg',
    'Grid Images/MVI_0288.00_00_13_13.Still001.jpg',
    'Grid Images/MVI_0288.00_00_20_00.Still003.jpg',
    'Grid Images/MVI_0451.00_01_13_14.Still001.jpg',
    'Grid Images/MVI_0521.00_00_04_04.Still002.jpg',
    'Grid Images/MVI_0886.00_00_20_16.Still002.jpg',
    'Grid Images/MVI_0896.00_01_01_01.Still003.jpg',
    'Grid Images/MVI_0912.00_00_02_02.Still001.jpg',
    'Grid Images/MVI_0917.00_00_53_10.Still001.jpg',
    'Grid Images/MVI_0952.00_00_07_04.Still001.jpg',
    'Grid Images/MVI_1088.00_00_29_10.Still003.jpg',
    'Grid Images/MVI_1495.00_00_20_09.Still006.jpg',
    'Grid Images/MVI_1602.00_00_22_06.Still002.jpg'
];

let velocityX = 0, velocityY = 0;
let showingFragments = true, hasToggledThisMotion = false;

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const MOUSE_DISTANCE_THRESHOLD = 250;
const MOBILE_BLUR_HOLD_MS = 0;
const MOBILE_BLUR_RAMP_UP_MS = 300;
const MOBILE_BLUR_CROSSFADE_IN_MS = 1000;
const MOBILE_BLUR_RAMP_DOWN_MS = 650;
const DESKTOP_BLUR_HOLD_MS = 0;
const DESKTOP_BLUR_PEAK = 110;
const MOBILE_BLUR_PEAK = 80;
const SMEAR_COLOR = '240, 109, 168';
let lastMouseX = null, lastMouseY = null, distanceSinceLastToggle = 0;
let isMouseTriggerAnimating = false;

function getSmearShadow(intensity) {
    if (intensity <= 0) return 'none';
    const layers = [];
    const steps = 50;
    const maxOffset = 150;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const offset = t * maxOffset * intensity;
        const opacity = Math.pow(1 - t, 2) * 0.1 * intensity;
        layers.push(`${offset}px 0 0 rgba(${SMEAR_COLOR}, ${opacity.toFixed(3)})`);
        layers.push(`${-offset}px 0 0 rgba(${SMEAR_COLOR}, ${opacity.toFixed(3)})`);
    }
    return layers.join(', ');
}

function processMouseDistanceTrigger(clientX, clientY) {
    if (!isPreloadActive()) return;
    if (isMouseTriggerAnimating) {
        lastMouseX = clientX;
        lastMouseY = clientY;
        return;
    }
    if (lastMouseX !== null && lastMouseY !== null) {
        const dx = Math.abs(clientX - lastMouseX);
        distanceSinceLastToggle += dx;
        if (distanceSinceLastToggle >= MOUSE_DISTANCE_THRESHOLD) {
            isMouseTriggerAnimating = true;
            hasToggledThisMotion = false;
            distanceSinceLastToggle = 0;
            runDesktopHeroBlur();
        }
    }
    lastMouseX = clientX;
    lastMouseY = clientY;
}

function runDesktopHeroBlur() {
    const { rearview, fragments } = getActiveHeroPair();
    if (!rearview || !fragments) return;
    hasToggledThisMotion = false;
    velocityX = 60;
    velocityY = 0;
    rearview.style.transition = 'none';
    fragments.style.transition = 'none';

    if (showingFragments) {
        runDesktopBlurToRearview(rearview, fragments);
    } else {
        runDesktopBlurToFragments(rearview, fragments);
    }
}

function runDesktopBlurToRearview(rearview, fragments) {
    fragments.style.opacity = '1';
    rearview.style.opacity = '0';
    rearview.style.textShadow = 'none';
    fragments.style.textShadow = 'none';
    const peakIntensity = DESKTOP_BLUR_PEAK / 100;
    const peakShadow = getSmearShadow(peakIntensity);
    const rampUpStart = performance.now();
    function smearRampUp(now) {
        const elapsed = now - rampUpStart;
        const t = Math.min(elapsed / MOBILE_BLUR_RAMP_UP_MS, 1);
        const smearEased = Math.pow(t, 3);
        const intensity = smearEased * peakIntensity;
        fragments.style.textShadow = getSmearShadow(intensity);
        if (t < 1) {
            requestAnimationFrame(smearRampUp);
            return;
        }
        const crossfadeStart = performance.now();
        function crossfadeAtPeak(now) {
            const elapsed = now - crossfadeStart;
            const t = Math.min(elapsed / MOBILE_BLUR_CROSSFADE_IN_MS, 1);
            const bump = 0.25 * Math.sin(Math.PI * t);
            fragments.style.textShadow = peakShadow;
            rearview.style.textShadow = peakShadow;
            fragments.style.opacity = String(Math.min(1, Math.max(0, 1 - t + bump)));
            rearview.style.opacity = String(Math.min(1, Math.max(0, t + bump)));
            if (t < 1) {
                requestAnimationFrame(crossfadeAtPeak);
                return;
            }
            velocityX = velocityY = 0;
            setTimeout(() => {
                const rampDownStart = performance.now();
                function smearRampDown(now) {
                    const elapsed = now - rampDownStart;
                    const progress = Math.min(elapsed / MOBILE_BLUR_RAMP_DOWN_MS, 1);
                    const eased = 1 - Math.pow(1 - progress, 4);
                    const intensity = (1 - eased) * peakIntensity;
                    const shadow = getSmearShadow(intensity);
                    rearview.style.textShadow = shadow;
                    fragments.style.textShadow = shadow;
                    if (progress < 1) {
                        requestAnimationFrame(smearRampDown);
                        return;
                    }
                    rearview.style.textShadow = 'none';
                    fragments.style.textShadow = 'none';
                    rearview.style.opacity = '1';
                    showingFragments = false;
                    isMouseTriggerAnimating = false;
                }
                requestAnimationFrame(smearRampDown);
            }, DESKTOP_BLUR_HOLD_MS);
        }
        requestAnimationFrame(crossfadeAtPeak);
    }
    requestAnimationFrame(smearRampUp);
}

function runDesktopBlurToFragments(rearview, fragments) {
    rearview.style.opacity = '1';
    fragments.style.opacity = '0';
    rearview.style.textShadow = 'none';
    fragments.style.textShadow = 'none';
    velocityX = velocityY = 0;
    const peakIntensity = DESKTOP_BLUR_PEAK / 100;
    const peakShadow = getSmearShadow(peakIntensity);
    const rampUpStart = performance.now();
    function smearRampUp(now) {
        const elapsed = now - rampUpStart;
        const t = Math.min(elapsed / MOBILE_BLUR_RAMP_UP_MS, 1);
        const smearEased = Math.pow(t, 3);
        const intensity = smearEased * peakIntensity;
        rearview.style.textShadow = getSmearShadow(intensity);
        if (t < 1) {
            requestAnimationFrame(smearRampUp);
            return;
        }
        const crossfadeStart = performance.now();
        function crossfadeAtPeak(now) {
            const elapsed = now - crossfadeStart;
            const t = Math.min(elapsed / MOBILE_BLUR_CROSSFADE_IN_MS, 1);
            const bump = 0.25 * Math.sin(Math.PI * t);
            rearview.style.textShadow = peakShadow;
            fragments.style.textShadow = peakShadow;
            rearview.style.opacity = String(Math.min(1, Math.max(0, 1 - t + bump)));
            fragments.style.opacity = String(Math.min(1, Math.max(0, t + bump)));
            if (t < 1) {
                requestAnimationFrame(crossfadeAtPeak);
                return;
            }
            setTimeout(() => {
                const rampDownStart = performance.now();
                function smearRampDown(now) {
                    const elapsed = now - rampDownStart;
                    const progress = Math.min(elapsed / MOBILE_BLUR_RAMP_DOWN_MS, 1);
                    const eased = 1 - Math.pow(1 - progress, 4);
                    const intensity = (1 - eased) * peakIntensity;
                    const shadow = getSmearShadow(intensity);
                    rearview.style.textShadow = shadow;
                    fragments.style.textShadow = shadow;
                    if (progress < 1) {
                        requestAnimationFrame(smearRampDown);
                        return;
                    }
                    rearview.style.textShadow = 'none';
                    fragments.style.textShadow = 'none';
                    rearview.style.opacity = '0';
                    fragments.style.opacity = '1';
                    showingFragments = true;
                    isMouseTriggerAnimating = false;
                }
                requestAnimationFrame(smearRampDown);
            }, DESKTOP_BLUR_HOLD_MS);
        }
        requestAnimationFrame(crossfadeAtPeak);
    }
    requestAnimationFrame(smearRampUp);
}

function isPreloadActive() {
    return !document.body.classList.contains('preload-dismissed');
}

function getActiveHeroPair() {
    if (isPreloadActive()) {
        return {
            rearview: document.getElementById('preloadHeroRearview'),
            fragments: document.getElementById('preloadHeroFragments')
        };
    }
    return {
        rearview: document.getElementById('homeHeroRearview'),
        fragments: document.getElementById('homeHeroFragments')
    };
}

const PRELOAD_BG_FOLLOW_STRENGTH = 14;
const PRELOAD_BG_SCALE = 1.12;
const PRELOAD_BG_LERP = 0.18;
let preloadBgTargetX = 0, preloadBgTargetY = 0;
let preloadBgCurrentX = 0, preloadBgCurrentY = 0;
let preloadBgRafId = null;

function setPreloadBgTarget(clientX, clientY) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const relX = (clientX - w / 2) / (w / 2);
    const relY = (clientY - h / 2) / (h / 2);
    preloadBgTargetX = relX * PRELOAD_BG_FOLLOW_STRENGTH;
    preloadBgTargetY = relY * PRELOAD_BG_FOLLOW_STRENGTH;
}

function preloadBgTick() {
    if (!isPreloadActive()) {
        preloadBgRafId = null;
        return;
    }
    const preloadBgImg = document.getElementById('preloadBgImg');
    if (!preloadBgImg) {
        preloadBgRafId = null;
        return;
    }
    preloadBgCurrentX += (preloadBgTargetX - preloadBgCurrentX) * PRELOAD_BG_LERP;
    preloadBgCurrentY += (preloadBgTargetY - preloadBgCurrentY) * PRELOAD_BG_LERP;
    preloadBgImg.style.transform = `scale(${PRELOAD_BG_SCALE}) translate(${preloadBgCurrentX}px, ${preloadBgCurrentY}px) translateZ(0)`;
    preloadBgRafId = requestAnimationFrame(preloadBgTick);
}

function updatePreloadBgFollow(clientX, clientY) {
    setPreloadBgTarget(clientX, clientY);
    if (!preloadBgRafId && isPreloadActive()) {
        preloadBgRafId = requestAnimationFrame(preloadBgTick);
    }
}

function resetPreloadBgFollow() {
    preloadBgTargetX = preloadBgTargetY = 0;
    if (!isPreloadActive()) {
        preloadBgCurrentX = preloadBgCurrentY = 0;
        const preloadBgImg = document.getElementById('preloadBgImg');
        if (preloadBgImg) preloadBgImg.style.transform = `scale(${PRELOAD_BG_SCALE}) translate(0, 0) translateZ(0)`;
    } else if (!preloadBgRafId) {
        preloadBgRafId = requestAnimationFrame(preloadBgTick);
    }
}

function handleMouseMove(e) {
    updatePreloadBgFollow(e.clientX, e.clientY);
    processMouseDistanceTrigger(e.clientX, e.clientY);
}

function handleTouchMove(e) {
    if (e.touches.length === 1) {
        const t = e.touches[0];
        updatePreloadBgFollow(t.clientX, t.clientY);
        processMouseDistanceTrigger(t.clientX, t.clientY);
    }
}

function handleTouchEnd(e) {
    if (e.touches && e.touches.length === 0) resetPreloadBgFollow();
}

document.addEventListener('DOMContentLoaded', function() {
    const mobile = isMobile();
    if (mobile) {
        document.body.classList.add('is-mobile');
        document.documentElement.classList.add('is-mobile');
    }

    const customCursor = document.getElementById('customCursor');
    if (customCursor) {
        document.addEventListener('mousemove', function(e) {
            customCursor.classList.add('is-visible');
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
        });
    }

    const preloadBgImg = document.getElementById('preloadBgImg');
    const preloadCycleImages = (function() {
        const arr = [...PRELOAD_HERO_IMAGES];
        shuffleArray(arr);
        return arr.slice(0, 6);
    })();

    function loadRandomPreloadImage() {
        if (!preloadBgImg || !preloadCycleImages.length) return;
        preloadBgImg.src = preloadCycleImages[0];
    }

    function runPreloadBgZoomOut() {
        if (!preloadBgImg || typeof gsap === 'undefined') return;
        gsap.fromTo(preloadBgImg, { scale: 1.2 }, {
            scale: 1.12,
            duration: 0.6,
            ease: 'power2.out'
        });
    }

    let preloadInClickCycle = false;
    if (!mobile) {
        if (preloadBgImg) {
            preloadBgImg.addEventListener('load', function() {
                if (!preloadInClickCycle) runPreloadBgZoomOut();
            });
        }
        loadRandomPreloadImage();
        if (preloadBgImg && preloadBgImg.complete && preloadBgImg.src) runPreloadBgZoomOut();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('mouseleave', resetPreloadBgFollow);
        document.addEventListener('mouseout', function(e) {
            if (!e.relatedTarget || !document.contains(e.relatedTarget)) resetPreloadBgFollow();
        });
    }

    const mainPage = document.getElementById('mainPage');
    const preload = document.getElementById('preload');
    const mainFooter = document.querySelector('.main-page .footer-area');

    if (mobile) {
        const mobilePreload = document.getElementById('mobilePreload');
        const mobileShutterAudio = new Audio('Audio/Mixdown/Shutter 5x_Mixdown_01.mp3');
        mobileShutterAudio.preload = 'auto';
        mobileShutterAudio.load();
        const mobileGalleryOrder = (function() {
            const arr = [...PRELOAD_HERO_IMAGES];
            shuffleArray(arr);
            return arr;
        })();
        const mobilePreloadCycleImages = mobileGalleryOrder.slice(0, 5);
        const mobilePreloadHeroFragments = document.getElementById('mobilePreloadHeroFragments');
        const mobilePreloadHero = mobilePreload?.querySelector('.mobile-preload-hero');

        if (mobilePreloadHeroFragments) {
            gsap.fromTo(mobilePreloadHeroFragments,
                { opacity: 0, scale: 1.15, xPercent: -50, yPercent: -50 },
                { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, duration: 0.5, ease: 'power2.out' }
            );
        }

        function runMobileAutoHeroBlur() {
            const rearview = document.getElementById('mobilePreloadHeroRearview');
            const fragments = document.getElementById('mobilePreloadHeroFragments');
            if (!rearview || !fragments) return;
            const tempShowing = showingFragments;
            showingFragments = false;
            hasToggledThisMotion = false;
            velocityX = 60;
            velocityY = 0;
            rearview.style.transition = 'none';
            fragments.style.transition = 'none';
            rearview.style.textShadow = 'none';
            fragments.style.textShadow = 'none';
            rearview.style.opacity = '0';
            const peakIntensity = MOBILE_BLUR_PEAK / 100;
            const peakShadow = getSmearShadow(peakIntensity);
            const rampUpStart = performance.now();
            function smearRampUp(now) {
                const elapsed = now - rampUpStart;
                const t = Math.min(elapsed / MOBILE_BLUR_RAMP_UP_MS, 1);
                const smearEased = Math.pow(t, 3);
                const intensity = smearEased * peakIntensity;
                fragments.style.textShadow = getSmearShadow(intensity);
                if (t < 1) {
                    requestAnimationFrame(smearRampUp);
                    return;
                }
                const crossfadeStart = performance.now();
                function crossfadeAtPeak(now) {
                    const elapsed = now - crossfadeStart;
                    const t = Math.min(elapsed / MOBILE_BLUR_CROSSFADE_IN_MS, 1);
                    const bump = 0.25 * Math.sin(Math.PI * t);
                    fragments.style.textShadow = peakShadow;
                    rearview.style.textShadow = peakShadow;
                    fragments.style.opacity = String(Math.min(1, Math.max(0, 1 - t + bump)));
                    rearview.style.opacity = String(Math.min(1, Math.max(0, t + bump)));
                    if (t < 1) {
                        requestAnimationFrame(crossfadeAtPeak);
                        return;
                    }
                    velocityX = velocityY = 0;
                    setTimeout(() => {
                        const rampDownStart = performance.now();
                        function smearRampDown(now) {
                            const elapsed = now - rampDownStart;
                            const progress = Math.min(elapsed / MOBILE_BLUR_RAMP_DOWN_MS, 1);
                            const eased = 1 - Math.pow(1 - progress, 4);
                            const intensity = (1 - eased) * peakIntensity;
                            const shadow = getSmearShadow(intensity);
                            rearview.style.textShadow = shadow;
                            fragments.style.textShadow = shadow;
                            if (progress < 1) {
                                requestAnimationFrame(smearRampDown);
                                return;
                            }
                            rearview.style.textShadow = 'none';
                            fragments.style.textShadow = 'none';
                            rearview.style.opacity = '1';
                            showingFragments = tempShowing;
                        }
                        requestAnimationFrame(smearRampDown);
                    }, MOBILE_BLUR_HOLD_MS);
                }
                requestAnimationFrame(crossfadeAtPeak);
            }
            requestAnimationFrame(smearRampUp);
        }

        setTimeout(runMobileAutoHeroBlur, 1500);

        let mobileFocusIndex = 0;
        let mobilePreloadHandled = false;
        function runMobilePreloadDismiss() {
            if (mobilePreloadHandled) return;
            mobilePreloadHandled = true;
            function startImageCycle() {
                const cycleMs = 150;
                const flashCount = 5;
                const mobileGalleryView = document.getElementById('mobileGalleryView');
                const mobileGalleryImg = document.getElementById('mobileGalleryImg');
                document.body.classList.add('mobile-preload-dismissed');
                if (mobilePreload) mobilePreload.classList.add('mobile-preload-faded');
                if (mobileGalleryView) mobileGalleryView.classList.add('is-visible');
                function updateMobileGridLabel() {
                    var btn = document.getElementById('mobileGridBtn');
                    if (btn && mobileGalleryImg && mobileGalleryImg.src) {
                        var name = mobileGalleryImg.src.split('/').pop() || '';
                        btn.textContent = name.replace(/\.Still\d+\.\w+$/i, '') || name;
                    }
                }
                if (mobileGalleryImg) {
                    mobileGalleryImg.src = mobilePreloadCycleImages[0];
                    updateMobileGridLabel();
                }
                const mobileGridBtn = document.getElementById('mobileGridBtn');
                const mobileInfoBtn = document.getElementById('mobileInfoBtn');
                const mobileGalleryFooter = mobileGalleryView?.querySelector('.mobile-gallery-footer');
                gsap.set(mobileGridBtn, { opacity: 0 });
                gsap.set(mobileInfoBtn, { opacity: 0 });
                gsap.set(mobileGalleryFooter, { opacity: 0 });
                mobileShutterAudio.currentTime = 0;
                mobileShutterAudio.play().catch(function() {});
                let step = 1;
                const flashInterval = setInterval(function() {
                    if (mobileGalleryImg) {
                        mobileGalleryImg.src = mobilePreloadCycleImages[step];
                        updateMobileGridLabel();
                    }
                    step++;
                    if (step >= flashCount) {
                        clearInterval(flashInterval);
                        mobileFocusIndex = 4;
                        setTimeout(function() {
                        gsap.to(mobileGridBtn, { opacity: 1, duration: 0.35, delay: 0.2, ease: 'power2.out' });
                        gsap.to(mobileInfoBtn, { opacity: 1, duration: 0.35, delay: 0.25, ease: 'power2.out' });
                        gsap.to(mobileGalleryFooter, { opacity: 1, duration: 0.4, delay: 0.3, ease: 'power3.out' });
                        if (mobileInfoBtn && infoOverlay) {
                            mobileInfoBtn.addEventListener('click', openInfoOverlay);
                        }
                        let swipeStartX = 0;
                        let mobileGalleryAnimating = false;
                        let lastNavTime = 0;
                        const NAV_COOLDOWN_MS = 350;
                        function goToMobileImage(index) {
                            if (mobileGalleryAnimating) return;
                            const now = Date.now();
                            if (now - lastNavTime < NAV_COOLDOWN_MS) return;
                            mobileGalleryAnimating = true;
                            lastNavTime = now;
                            const len = mobileGalleryOrder.length;
                            const idx = ((index % len) + len) % len;
                            const newSrc = mobileGalleryOrder[idx];
                            const dir = index > mobileFocusIndex ? 1 : -1;
                            const preloader = new Image();
                            let didStartTransition = false;
                            preloader.onload = preloader.onerror = function() {
                                if (didStartTransition) return;
                                didStartTransition = true;
                                gsap.to(mobileGalleryImg, {
                                    x: -dir * 30,
                                    opacity: 0,
                                    duration: 0.2,
                                    ease: 'power2.in',
                                    onComplete: function() {
                                        mobileFocusIndex = idx;
                                        mobileGalleryImg.src = newSrc;
                                        updateMobileGridLabel();
                                        gsap.set(mobileGalleryImg, { x: dir * 30 });
                                        gsap.to(mobileGalleryImg, {
                                            x: 0,
                                            opacity: 1,
                                            duration: 0.25,
                                            ease: 'power3.out',
                                            onComplete: function() {
                                                gsap.set(mobileGalleryImg, { clearProps: 'x' });
                                                mobileGalleryAnimating = false;
                                            }
                                        });
                                    }
                                });
                            };
                            preloader.src = newSrc;
                            if (preloader.complete) preloader.onload();
                        }
                        mobileGalleryView.addEventListener('touchstart', (e) => {
                            if (e.touches.length === 1) swipeStartX = e.touches[0].pageX;
                        }, { passive: true });
                        mobileGalleryView.addEventListener('touchend', (e) => {
                            if (!e.changedTouches?.length || !mobileGalleryView.classList.contains('is-visible')) return;
                            const dx = e.changedTouches[0].pageX - swipeStartX;
                            if (Math.abs(dx) > 50) {
                                if (dx < 0) goToMobileImage(mobileFocusIndex + 1);
                                else goToMobileImage(mobileFocusIndex - 1);
                            } else {
                                const tapTarget = e.target;
                                if (tapTarget.closest('.mobile-grid-btn') || tapTarget.closest('.mobile-gallery-footer')) return;
                                const tapX = e.changedTouches[0].pageX;
                                const w = window.innerWidth;
                                if (tapX < w * 0.25) goToMobileImage(mobileFocusIndex - 1);
                                else if (tapX > w * 0.75) goToMobileImage(mobileFocusIndex + 1);
                            }
                        }, { passive: true });
                        }, 300);
                    }
                }, cycleMs);
            }
            if (mobilePreloadHero) {
                gsap.to(mobilePreloadHero, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: startImageCycle });
            } else {
                startImageCycle();
            }
        }
        if (mobilePreload) {
            mobilePreload.addEventListener('touchstart', function() { runMobilePreloadDismiss(); }, { passive: true });
            mobilePreload.addEventListener('click', function() { runMobilePreloadDismiss(); });
        }
    }

    if (preload && !mobile) {
        let preloadClickHandled = false;
        preload.addEventListener('click', function() {
            if (preloadClickHandled) return;
            preloadClickHandled = true;
            preloadInClickCycle = true;

            const cycleMs = 150;
            const flashCount = 5;

            const audio = new Audio('Audio/Mixdown/Shutter 5x_Mixdown_01.mp3');
            audio.play().catch(function() {});

            const cycleImages = preloadCycleImages.slice(1, 6);
            let step = 0;
            const flashInterval = setInterval(function() {
                if (preloadBgImg) preloadBgImg.src = cycleImages[step];
                step++;
                if (step >= flashCount) {
                    clearInterval(flashInterval);
                    setTimeout(runPreloadDismiss, 300);
                }
            }, cycleMs);
        });
    }

    function runPreloadDismiss() {
        document.documentElement.classList.add('no-scroll');
        document.body.classList.add('no-scroll');
        document.body.classList.add('preload-dismissed');
        setTimeout(function() { preload.classList.add('preload-faded'); }, 200);
        if (mainPage) mainPage.classList.add('has-entered');
        if (mainFooter) {
            gsap.fromTo(mainFooter, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.4, ease: 'power3.out', onComplete: function() {
                document.documentElement.classList.remove('no-scroll');
                document.body.classList.remove('no-scroll');
            }});
        } else {
            setTimeout(function() {
                document.documentElement.classList.remove('no-scroll');
                document.body.classList.remove('no-scroll');
            }, 800);
        }
    }

    const infoBtn = document.getElementById('infoBtn');
    const infoOverlay = document.getElementById('infoOverlay');
    const infoClose = document.getElementById('infoClose');
    function openInfoOverlay() {
        if (!infoOverlay) return;
        if (mobile) {
            document.body.classList.add('is-overlay-open');
            const img = document.getElementById('mobileGalleryImg');
            const inner = document.querySelector('.mobile-gallery-inner');
            if (img) gsap.set(img, { clearProps: 'all' });
            if (inner) gsap.set(inner, { clearProps: 'all' });
            void document.body.offsetHeight;
        } else {
            document.body.classList.add('is-overlay-open');
        }
        document.documentElement.classList.add('no-scroll');
        document.body.classList.add('no-scroll');
        infoOverlay.classList.add('is-open');
        infoOverlay.setAttribute('aria-hidden', 'false');
        gsap.set(infoOverlay, { opacity: 0 });
        const nameItems = infoOverlay.querySelectorAll('.info-names > div');
        gsap.set(nameItems, { opacity: 0, y: 14 });
        const tl = gsap.timeline();
        tl.to(infoOverlay, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
        tl.to(nameItems, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power3.out' }, 0.5);
    }

    function closeInfoOverlay() {
        if (!infoOverlay) return;
        gsap.to(infoOverlay, {
            opacity: 0,
            duration: 0.35,
            ease: 'power2.out',
            onComplete: function() {
                infoOverlay.classList.remove('is-open');
                infoOverlay.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('is-overlay-open');
                document.documentElement.classList.remove('no-scroll');
                document.body.classList.remove('no-scroll');
            }
        });
    }

    if (infoBtn && infoOverlay) {
        infoBtn.addEventListener('click', openInfoOverlay);
    }
    if (infoClose && infoOverlay) {
        infoClose.addEventListener('click', closeInfoOverlay);
    }

    const infoAudioBtn = document.getElementById('infoAudioBtn');
    if (infoAudioBtn) {
        infoAudioBtn.addEventListener('click', function() {
            const isOn = this.textContent.includes('On');
            this.textContent = isOn ? 'Site Audio: Off' : 'Site Audio: On';
        });
    }

    const gallerySection = document.getElementById('gallerySection');
    const galleryTrack = document.getElementById('galleryTrack');
    const galleryOrder = [...PRELOAD_HERO_IMAGES];
    if (!mobile && gallerySection && galleryTrack && PRELOAD_HERO_IMAGES.length) {
        shuffleArray(galleryOrder);
        const REPEATS = 3;
        let html = '';
        for (let r = 0; r < REPEATS; r++) {
            for (let i = 0; i < galleryOrder.length; i++) {
                html += `<div class="gallery-img-wrap"><img class="gallery-img" src="${galleryOrder[i]}" alt="" loading="lazy" draggable="false"></div>`;
            }
        }
        galleryTrack.innerHTML = html;

        const wraps = galleryTrack.querySelectorAll('.gallery-img-wrap');
        gsap.set(wraps, { opacity: 0, y: 20 });

        function runGalleryEntranceAnimation(wraps, section, delay = 0.06) {
            const viewCenter = section ? section.scrollLeft + section.clientWidth / 2 : 0;
            const STAGGER_PER_PX = 0.028 / 250;
            gsap.from(wraps, {
                opacity: 0,
                y: 20,
                duration: 0.65,
                ease: 'power3.out',
                stagger: (i) => {
                    const w = wraps[i];
                    const wrapCenter = w.offsetLeft + w.offsetWidth / 2;
                    return Math.abs(wrapCenter - viewCenter) * STAGGER_PER_PX;
                },
                delay
            });
        }

        let dragging = false, startX, startScrollLeft, hasDragged = false;
        let lastScrollLeft = 0, lastMoveTime = 0;
        let velocitySamples = [];
        const THROW_MULTIPLIER = 75;
        const THROW_MAX = 1000;
        const THROW_DURATION_MIN = 0.35;
        const THROW_DURATION_MAX = 1.4;
        const THROW_DURATION_PER_PX = 1 / 350;
        let throwTarget = null;

        function tryOpenGalleryFocus(targetEl) {
            const wrap = targetEl?.closest?.('.gallery-img-wrap');
            const img = wrap?.querySelector('.gallery-img') || targetEl?.closest?.('.gallery-img');
            if (img?.src && wrap) openGalleryFocus(img.src, wrap);
        }

        function applyThrow() {
            if (velocitySamples.length === 0) return;
            const peak = velocitySamples.reduce((a, b) => Math.abs(a) >= Math.abs(b) ? a : b);
            if (Math.abs(peak) < 0.3) return;
            const distance = Math.sign(peak) * Math.min(Math.abs(peak) * THROW_MULTIPLIER, THROW_MAX);
            const target = gallerySection.scrollLeft + distance;
            const duration = Math.max(THROW_DURATION_MIN, Math.min(THROW_DURATION_MAX, Math.abs(distance) * THROW_DURATION_PER_PX));
            throwTarget = target;
            gsap.to(gallerySection, {
                scrollLeft: target,
                duration,
                ease: 'expo.out',
                overwrite: true,
                onComplete: () => { throwTarget = null; },
                onKill: () => { throwTarget = null; }
            });
        }

        gallerySection.addEventListener('mousedown', (e) => {
            dragging = true;
            hasDragged = false;
            startX = e.pageX;
            startScrollLeft = gallerySection.scrollLeft;
            lastScrollLeft = startScrollLeft;
            lastMoveTime = performance.now();
            velocitySamples = [];
            gsap.killTweensOf(gallerySection);
        });
        gallerySection.addEventListener('mouseleave', () => { dragging = false; });
        gallerySection.addEventListener('mouseup', (e) => {
            if (!hasDragged && (e.target.closest('.gallery-img') || e.target.closest('.gallery-img-wrap')))
                tryOpenGalleryFocus(e.target);
            if (hasDragged) applyThrow();
            dragging = false;
        });
        gallerySection.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            hasDragged = true;
            e.preventDefault();
            gallerySection.scrollLeft = startScrollLeft - (e.pageX - startX);
            const t = performance.now();
            const dt = t - lastMoveTime;
            if (dt > 0) {
                const v = (gallerySection.scrollLeft - lastScrollLeft) / dt;
                velocitySamples.push(v);
                if (velocitySamples.length > 8) velocitySamples.shift();
            }
            lastScrollLeft = gallerySection.scrollLeft;
            lastMoveTime = t;
        });
        gallerySection.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                dragging = true;
                hasDragged = false;
                startX = e.touches[0].pageX;
                startScrollLeft = gallerySection.scrollLeft;
                lastScrollLeft = startScrollLeft;
                lastMoveTime = performance.now();
                velocitySamples = [];
                gsap.killTweensOf(gallerySection);
            }
        }, { passive: true });
        gallerySection.addEventListener('touchmove', (e) => {
            if (!dragging || e.touches.length !== 1) return;
            hasDragged = true;
            e.preventDefault();
            gallerySection.scrollLeft = startScrollLeft - (e.touches[0].pageX - startX);
            const t = performance.now();
            const dt = t - lastMoveTime;
            if (dt > 0) {
                const v = (gallerySection.scrollLeft - lastScrollLeft) / dt;
                velocitySamples.push(v);
                if (velocitySamples.length > 8) velocitySamples.shift();
            }
            lastScrollLeft = gallerySection.scrollLeft;
            lastMoveTime = t;
        }, { passive: false });
        gallerySection.addEventListener('touchend', (e) => {
            if (!hasDragged && e.changedTouches?.length && (e.target.closest('.gallery-img') || e.target.closest('.gallery-img-wrap')))
                tryOpenGalleryFocus(e.target);
            if (hasDragged) applyThrow();
            dragging = false;
        });

        document.addEventListener('wheel', function galleryWheel(e) {
            if (isPreloadActive()) return;
            let dx = e.deltaX || 0, dy = e.deltaY || 0;
            if (e.deltaMode === 1) { dx *= 33; dy *= 33; }
            if (e.deltaMode === 2) { dx *= 100; dy *= 100; }
            if (dx !== 0 || dy !== 0) {
                gallerySection.scrollLeft += dx + dy;
                e.preventDefault();
            }
        }, { passive: false, capture: true });

        function initInfiniteScroll() {
            const firstWrap = galleryTrack.querySelector('.gallery-img-wrap');
            const cw = gallerySection.clientWidth;
            if (!firstWrap || firstWrap.offsetWidth === 0 || cw < 100) {
                requestAnimationFrame(initInfiniteScroll);
                return;
            }
            const cycleWidth = galleryOrder.length * (firstWrap.offsetWidth + 6);
            const pad = Math.max(0, (cw - cycleWidth) / 2);
            galleryTrack.style.paddingLeft = galleryTrack.style.paddingRight = pad + 'px';
            const targetScroll = Math.max(0, pad + cycleWidth - cw / 2);
            gallerySection.scrollLeft = targetScroll;
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    gallerySection.scrollLeft = targetScroll;
                    gsap.set(wraps, { opacity: 1, y: 0 });
                    runGalleryEntranceAnimation(wraps, gallerySection, 0.25);
                });
            });

            const BUFFER = 100;

            function wrap(dir) {
                const s = gallerySection.scrollLeft;
                const jump = dir === 1 ? cycleWidth : -cycleWidth;
                const tweens = gsap.getTweensOf(gallerySection);
                if (tweens.length && throwTarget != null) {
                    const tween = tweens[0];
                    const newTarget = throwTarget + jump;
                    const remain = (1 - tween.progress()) * (tween.duration() || 1);
                    tween.kill();
                    throwTarget = newTarget;
                    gallerySection.scrollLeft = s + jump;
                    if (remain > 0.03) gsap.to(gallerySection, {
                        scrollLeft: newTarget, duration: remain, ease: 'expo.out', overwrite: true,
                        onComplete: () => { throwTarget = null; },
                        onKill: () => { throwTarget = null; }
                    });
                } else {
                    throwTarget = null;
                    gallerySection.scrollLeft = s + jump;
                }
            }

            function loop() {
                const s = gallerySection.scrollLeft;
                const max = gallerySection.scrollWidth - gallerySection.clientWidth;
                if (s <= pad + BUFFER) wrap(1);
                else if (s >= max - BUFFER) wrap(-1);
                requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(initInfiniteScroll);

    }

    const galleryFocus = document.getElementById('galleryFocus');
    const galleryFocusImg = document.getElementById('galleryFocusImg');
    const galleryFocusInner = document.querySelector('.gallery-focus-inner');
    const galleryFocusClose = document.getElementById('galleryFocusClose');
    let currentFocusIndex = 0;

    function goToFocusImage(index) {
        if (!galleryFocusImg || !galleryFocusInner || !galleryOrder.length) return;
        const len = galleryOrder.length;
        const prevIndex = currentFocusIndex;
        currentFocusIndex = ((index % len) + len) % len;
        const newSrc = galleryOrder[currentFocusIndex];
        const goingNext = index > prevIndex;
        const dir = goingNext ? 1 : -1;
        const slideDist = 60;

        gsap.to(galleryFocusInner, {
            x: -dir * slideDist,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: function() {
                gsap.set(galleryFocusInner, { x: dir * slideDist });
                galleryFocusImg.src = newSrc;
                gsap.to(galleryFocusInner, {
                    x: 0,
                    opacity: 1,
                    duration: 0.4,
                    ease: 'power3.out',
                    onComplete: function() {
                        gsap.set(galleryFocusInner, { clearProps: 'x' });
                    }
                });
            }
        });
    }

    function openGalleryFocus(src, wrapEl) {
        if (!galleryFocus || !galleryFocusImg || !galleryFocusInner || !wrapEl || !gallerySection || !galleryTrack) return;
        const wraps = Array.from(galleryTrack.querySelectorAll('.gallery-img-wrap'));
        const wrapIndex = wraps.indexOf(wrapEl);
        const len = PRELOAD_HERO_IMAGES.length;
        currentFocusIndex = wrapIndex >= 0 ? wrapIndex % len : 0;
        document.documentElement.classList.add('no-scroll');
        document.body.classList.add('no-scroll');
        galleryFocusImg.src = src;
        const centerX = wrapEl.offsetLeft + wrapEl.offsetWidth / 2;
        const others = wraps.filter((w) => w !== wrapEl);
        const byDist = others.map((w) => ({
            el: w,
            d: Math.abs((w.offsetLeft + w.offsetWidth / 2) - centerX)
        })).sort((a, b) => a.d - b.d);
        const staggerByEl = new Map();
        byDist.forEach((item, i) => { staggerByEl.set(item.el, i * 0.035); });

        const mainPageFooter = document.querySelector('.main-page .footer-area');
        const homeHero = document.querySelector('.home-hero');
        const tl = gsap.timeline();
        tl.to(wrapEl, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0);
        tl.to(others, {
            opacity: 0,
            duration: 0.5,
            stagger: (i, el) => staggerByEl.get(el) || 0,
            ease: 'power2.out'
        }, 0.08);
        if (mainPageFooter) {
            tl.to(mainPageFooter, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.08);
        }
        if (homeHero) {
            tl.to(homeHero, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.08);
        }
        tl.add(function() {
            galleryFocus.classList.add('is-open');
            galleryFocus.setAttribute('aria-hidden', 'false');
            gsap.set(galleryFocus, { opacity: 1, backgroundColor: 'rgba(255,255,255,0)' });
            gsap.set(galleryFocusInner, { scale: 0.94, opacity: 0 });
            gsap.to(galleryFocus, { backgroundColor: 'rgba(255,255,255,1)', duration: 0.35, ease: 'power2.out' });
            gsap.to(galleryFocusInner, {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: 'power3.out',
                onComplete: function() {
                    gsap.set(galleryFocusInner, { clearProps: 'scale,opacity' });
                }
            });
            if (galleryFocusClose) {
                gsap.to(galleryFocusClose, { opacity: 1, duration: 0.35, ease: 'power2.out' });
            }
        }, 0.55);
    }

    function closeGalleryFocus() {
        if (!galleryFocus) return;
        const mainPageFooter = document.querySelector('.main-page .footer-area');
        const homeHero = document.querySelector('.home-hero');
        const wraps = galleryTrack.querySelectorAll('.gallery-img-wrap');
        gsap.to(galleryFocus, {
            opacity: 0,
            duration: 0.35,
            ease: 'power2.out',
            onComplete: function() {
                galleryFocus.classList.remove('is-open');
                galleryFocus.setAttribute('aria-hidden', 'true');
                gsap.set(galleryFocus, { opacity: 0, backgroundColor: '' });
                gsap.set(galleryFocusInner, { clearProps: 'all' });
                if (galleryFocusClose) gsap.set(galleryFocusClose, { opacity: 0 });

                gsap.set(wraps, { opacity: 1, y: 0 });
                runGalleryEntranceAnimation(wraps, gallerySection, 0.06);
                if (mainPageFooter) {
                    gsap.fromTo(mainPageFooter, { opacity: 0 }, {
                        opacity: 1,
                        duration: 0.5,
                        delay: 0.2,
                        ease: 'power3.out',
                        onComplete: function() {
                            document.documentElement.classList.remove('no-scroll');
                            document.body.classList.remove('no-scroll');
                        }
                    });
                } else {
                    document.documentElement.classList.remove('no-scroll');
                    document.body.classList.remove('no-scroll');
                }
                if (homeHero) {
                    gsap.to(homeHero, { opacity: 1, duration: 0.5, delay: 0.2, ease: 'power3.out' });
                }
            }
        });
    }

    const galleryFocusPrev = document.getElementById('galleryFocusPrev');
    const galleryFocusNext = document.getElementById('galleryFocusNext');

    if (galleryFocusClose) {
        galleryFocusClose.addEventListener('click', function(e) {
            e.stopPropagation();
            closeGalleryFocus();
        });
    }
    if (galleryFocusPrev) {
        galleryFocusPrev.addEventListener('click', function(e) {
            e.stopPropagation();
            goToFocusImage(currentFocusIndex - 1);
        });
    }
    if (galleryFocusNext) {
        galleryFocusNext.addEventListener('click', function(e) {
            e.stopPropagation();
            goToFocusImage(currentFocusIndex + 1);
        });
    }
    if (galleryFocus) {
        const arrowLeftThreshold = 0.35;
        const arrowRightThreshold = 0.65;
        if (mobile) {
            let focusSwipeStartX = 0;
            galleryFocus.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) focusSwipeStartX = e.touches[0].pageX;
            }, { passive: true });
            galleryFocus.addEventListener('touchend', (e) => {
                if (!e.changedTouches?.length || !galleryFocus.classList.contains('is-open')) return;
                const dx = e.changedTouches[0].pageX - focusSwipeStartX;
                if (Math.abs(dx) > 50) {
                    if (dx < 0) goToFocusImage(currentFocusIndex + 1);
                    else goToFocusImage(currentFocusIndex - 1);
                }
            }, { passive: true });
        }
        galleryFocus.addEventListener('mousemove', function(e) {
            if (!galleryFocus.classList.contains('is-open')) return;
            const w = window.innerWidth;
            const x = e.clientX / w;
            if (galleryFocusPrev) {
                galleryFocusPrev.classList.toggle('is-visible', x < arrowLeftThreshold);
            }
            if (galleryFocusNext) {
                galleryFocusNext.classList.toggle('is-visible', x > arrowRightThreshold);
            }
        });
        galleryFocus.addEventListener('mouseleave', function() {
            if (galleryFocusPrev) galleryFocusPrev.classList.remove('is-visible');
            if (galleryFocusNext) galleryFocusNext.classList.remove('is-visible');
        });
        galleryFocus.addEventListener('click', function(e) {
            if (e.target.closest('.gallery-focus-close') || e.target.closest('.gallery-focus-prev') || e.target.closest('.gallery-focus-next')) return;
            const x = e.clientX / window.innerWidth;
            if (x < arrowLeftThreshold) {
                goToFocusImage(currentFocusIndex - 1);
            } else if (x > arrowRightThreshold) {
                goToFocusImage(currentFocusIndex + 1);
            }
        });
    }
});
