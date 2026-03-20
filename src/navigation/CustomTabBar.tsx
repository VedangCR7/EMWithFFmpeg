import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  InteractionManager,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomTabBar = (props: any) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedBusinessProfile } = useBusinessProfile();
  
  const [isLoadingPosters, setIsLoadingPosters] = useState<boolean>(false);
  const isMyBusinessFocused = props.state.routes[props.state.index]?.name === 'MyBusiness';
  const isHomeFocused = props.state.routes[props.state.index]?.name === 'Home';

  const [dimensions, setDimensions] = useState(() => ({ width: Dimensions.get('window').width }));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width });
    });
    return () => subscription?.remove();
  }, []);

  const currentScale = (size: number) => (dimensions.width / 375) * size;
  const currentModerateScale = (size: number, factor = 0.5) => size + (currentScale(size) - size) * factor;
  const isCurrentlySmall = dimensions.width < 375;

  const logoSize = currentModerateScale(isCurrentlySmall ? 36 : 42);
  const logoContainerSize = logoSize + currentModerateScale(6);
  const logoTopOffset = -(logoContainerSize / 2);
  const tabBarHeight = currentModerateScale(isCurrentlySmall ? 40 : 44);
  const tabBarPaddingBottom = Math.max(currentModerateScale(6), insets.bottom + currentModerateScale(2));
  const iconSize = currentModerateScale(isCurrentlySmall ? 24 : 20);
  const fontSize = currentModerateScale(isCurrentlySmall ? 10 : 8);
  const borderWidth = currentModerateScale(0.8);

  const handlePosterPlayerShortcut = useCallback(() => {
    props.navigation.navigate('MyBusiness');
  }, [props.navigation]);

  const handleTodaysPickPress = useCallback(() => {
    const parentNavigator = props.navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate('TodaysPick');
    } else {
      props.navigation.navigate('TodaysPick' as any);
    }
  }, [props.navigation]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const bgColorAnim = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;

  const animationRefs = useRef<any>({});

  const startAnimations = useCallback(() => {
    Object.values(animationRefs.current).forEach((anim: any) => anim?.stop?.());

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const borderAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(borderAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );

    const shadowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(shadowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const rippleAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim1, { toValue: 1, duration: 3000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(rippleAnim1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    const rippleAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(rippleAnim2, { toValue: 1, duration: 3000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(rippleAnim2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    const logoRotationAnimation = Animated.loop(
      Animated.timing(logoRotateAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    );

    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const bgColorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bgColorAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(bgColorAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );

    const entranceAnimation = Animated.spring(entranceAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true });

    animationRefs.current = {
      pulseAnimation, borderAnimation, shadowAnimation, floatAnimation,
      rippleAnimation1, rippleAnimation2, logoRotationAnimation,
      sparkleAnimation, bgColorAnimation, entranceAnimation,
    };

    Object.values(animationRefs.current).forEach((anim: any) => anim.start());
  }, [pulseAnim, borderAnim, shadowAnim, floatAnim, rippleAnim1, rippleAnim2, logoRotateAnim, sparkleAnim, bgColorAnim, entranceAnim]);

  useEffect(() => {
    const timeoutId = setTimeout(() => startAnimations(), 50);
    const interaction = InteractionManager.runAfterInteractions(() => startAnimations());
    return () => {
      clearTimeout(timeoutId);
      interaction.cancel();
      Object.values(animationRefs.current).forEach((anim: any) => anim?.stop?.());
    };
  }, [startAnimations]);

  useEffect(() => {
    if (isHomeFocused) {
      startAnimations();
      const interaction = InteractionManager.runAfterInteractions(() => startAnimations());
      return () => interaction.cancel();
    }
  }, [isHomeFocused, startAnimations]);

  const animatedBorderWidth = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 4] });
  const animatedBorderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.primary, theme.colors.secondary] });
  const animatedShadowRadius = shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 16] });
  const animatedShadowOpacity = shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  const floatTranslateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const handlePressIn = () => Animated.spring(pressAnim, { toValue: 0.9, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();

  const ripple1Scale = rippleAnim1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const ripple1Opacity = rippleAnim1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
  const ripple2Scale = rippleAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const ripple2Opacity = rippleAnim2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
  const sparkleOpacity = sparkleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const entranceScale = entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  if (isMyBusinessFocused) return null;

  const fabSize = currentModerateScale(isCurrentlySmall ? 48 : 56);
  const fabBottomOffset = tabBarHeight + tabBarPaddingBottom + currentModerateScale(16);

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      <View style={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: currentModerateScale(0.3),
        borderTopColor: theme.colors.border,
        paddingBottom: tabBarPaddingBottom,
        elevation: 4,
        position: 'relative',
      }}>
        <View style={{
          position: 'absolute', top: logoTopOffset, left: '50%',
          marginLeft: -(logoContainerSize / 2), zIndex: 999,
          backgroundColor: theme.colors.surface, width: logoContainerSize,
          height: logoContainerSize, borderRadius: logoContainerSize / 2,
        }} />
        <TouchableOpacity
          onPress={handlePosterPlayerShortcut}
          activeOpacity={0.7}
          style={{
            position: 'absolute', top: logoTopOffset, left: '50%',
            marginLeft: -(logoContainerSize / 2), zIndex: 1000,
            backgroundColor: theme.colors.surface, width: logoContainerSize,
            height: logoContainerSize, borderRadius: logoContainerSize / 2,
            justifyContent: 'center', alignItems: 'center',
            elevation: 4, borderWidth: borderWidth, borderColor: theme.colors.border,
            overflow: 'hidden',
          }}
        >
          <Image source={require('../assets/MainLogo/MB.png')} style={{ width: logoSize, height: logoSize, resizeMode: 'contain' }} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: tabBarHeight, marginTop: currentModerateScale(10) }}>
          {props.state.routes.map((route: any, index: number) => {
            const { options } = props.descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = props.state.index === index;
            const onPress = () => {
              if (route.name === 'MyBusiness') { handlePosterPlayerShortcut(); return; }
              const event = props.navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) props.navigation.navigate(route.name);
            };
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: currentModerateScale(4) }}>
                {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color: isFocused ? theme.colors.primary : theme.colors.textSecondary, size: iconSize }) : <View style={{ height: iconSize }} />}
                <Text style={{ fontSize, fontWeight: '600', color: isFocused ? theme.colors.primary : theme.colors.textSecondary }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {isHomeFocused && (
        <Animated.View style={{ position: 'absolute', bottom: fabBottomOffset, right: currentModerateScale(16), transform: [{ scale: pulseAnim }, { translateY: floatTranslateY }, { scale: entranceScale }], zIndex: 1001 }}>
          <Animated.View style={{ position: 'absolute', width: fabSize, height: fabSize, borderRadius: fabSize / 2, borderWidth: 2, borderColor: theme.colors.primary, transform: [{ scale: ripple1Scale }], opacity: ripple1Opacity }} />
          <Animated.View style={{ position: 'absolute', width: fabSize, height: fabSize, borderRadius: fabSize / 2, borderWidth: 2, borderColor: theme.colors.secondary, transform: [{ scale: ripple2Scale }], opacity: ripple2Opacity }} />
          <Animated.View style={{ width: fabSize, height: fabSize, borderRadius: fabSize / 2, borderWidth: animatedBorderWidth, borderColor: animatedBorderColor, justifyContent: 'center', alignItems: 'center', elevation: 12 }}>
            <Animated.View style={{ transform: [{ scale: pressAnim }], width: fabSize, height: fabSize, borderRadius: fabSize / 2, overflow: 'hidden' }}>
              <TouchableOpacity onPress={handleTodaysPickPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={{ width: '100%', height: '100%', borderRadius: fabSize / 2, justifyContent: 'center', alignItems: 'center', padding: currentModerateScale(4) }}>
                <LinearGradient colors={['#FFD700', '#FF8C00', '#FF6347']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: fabSize / 2, zIndex: 1 }} />
                <Animated.View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.2)', opacity: sparkleOpacity, borderRadius: fabSize / 2, zIndex: 2 }} />
                <View style={{ zIndex: 3, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: currentModerateScale(9), fontWeight: '700', textAlign: 'center' }}>Today's{'\n'}Pick</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

export default CustomTabBar;
