import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, Dimensions } from 'react-native';
import { Text } from './Text';
import { Star, X, ThumbsUp, MessageSquare } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Brand colors
const SUMEE_PURPLE = '#6D28D9';
const SUMEE_GREEN = '#10B981';

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    clientName?: string;
    jobTitle?: string;
}

/**
 * RatingModal - Beautiful post-job rating modal
 * Displays after completing a job to rate the client experience
 */
export function RatingModal({
    visible,
    onClose,
    onSubmit,
    clientName = 'Cliente',
    jobTitle = 'Trabajo',
}: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        onSubmit(rating, comment);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setRating(0);
            setComment('');
            onClose();
        }, 2000);
    };

    const quickComments = [
        { icon: ThumbsUp, label: 'Cliente amable' },
        { icon: MessageSquare, label: 'Buena comunicación' },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {submitted ? (
                        <View style={styles.successContainer}>
                            <View style={styles.checkCircle}>
                                <Text style={{ fontSize: 40 }}>✓</Text>
                            </View>
                            <Text style={styles.successTitle}>¡Gracias por tu feedback!</Text>
                            <Text style={styles.successSubtitle}>Tu calificación ayuda a mejorar Sumee</Text>
                        </View>
                    ) : (
                        <>
                            {/* Close Button */}
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <X size={24} color="#9CA3AF" />
                            </TouchableOpacity>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>¿Cómo estuvo tu experiencia?</Text>
                                <Text style={styles.subtitle}>
                                    Califica a {clientName} por el trabajo "{jobTitle}"
                                </Text>
                            </View>

                            {/* Star Rating */}
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setRating(star)}
                                        style={styles.starBtn}
                                    >
                                        <Star
                                            size={40}
                                            color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                                            fill={star <= rating ? '#F59E0B' : 'transparent'}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Rating Label */}
                            <Text style={styles.ratingLabel}>
                                {rating === 0 && 'Toca una estrella'}
                                {rating === 1 && 'Muy mal 😞'}
                                {rating === 2 && 'Mal 😕'}
                                {rating === 3 && 'Regular 😐'}
                                {rating === 4 && 'Bien 😊'}
                                {rating === 5 && '¡Excelente! 🎉'}
                            </Text>

                            {/* Quick Comments */}
                            <View style={styles.quickComments}>
                                {quickComments.map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.quickBtn,
                                            comment.includes(item.label) && styles.quickBtnActive
                                        ]}
                                        onPress={() => {
                                            if (comment.includes(item.label)) {
                                                setComment(comment.replace(item.label + '. ', ''));
                                            } else {
                                                setComment(prev => prev + item.label + '. ');
                                            }
                                        }}
                                    >
                                        <item.icon
                                            size={16}
                                            color={comment.includes(item.label) ? SUMEE_PURPLE : '#6B7280'}
                                        />
                                        <Text style={[
                                            styles.quickLabel,
                                            comment.includes(item.label) && { color: SUMEE_PURPLE }
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Comment Input */}
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Agrega un comentario (opcional)"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={comment}
                                onChangeText={setComment}
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={rating === 0}
                            >
                                <Text style={styles.submitBtnText}>Enviar Calificación</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        minHeight: 450,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    starBtn: {
        padding: 8,
    },
    ratingLabel: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 20,
    },
    quickComments: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 12,
    },
    quickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    quickBtnActive: {
        backgroundColor: '#F3E8FF',
    },
    quickLabel: {
        marginLeft: 6,
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    commentInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    submitBtn: {
        backgroundColor: SUMEE_PURPLE,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: SUMEE_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    successContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: SUMEE_GREEN,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
});

export default RatingModal;
