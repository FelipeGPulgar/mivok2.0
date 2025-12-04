import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Privacidad() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Política de Privacidad' }} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Política de Privacidad</Text>
                <Text style={styles.text}>
                    En Mivok, valoramos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información.
                </Text>
                {/* Add more content here as needed */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
});
