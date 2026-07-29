import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/features/tuner/presentation/hooks/useTheme';
import { Fonts } from '@/constants/theme';

export interface DropdownOption<T> {
  id: string;
  label: string;
  value: T;
}

interface SelectionDropdownProps<T> {
  options: DropdownOption<T>[];
  selectedOptionId: string;
  onSelect: (option: DropdownOption<T>) => void;
  title?: string;
}

export function SelectionDropdown<T>({
  options,
  selectedOptionId,
  onSelect,
  title = 'Select Option',
}: SelectionDropdownProps<T>) {
  const theme = useTheme();
  const { isTablet, insets } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.id === selectedOptionId);

  const handleSelect = (option: DropdownOption<T>) => {
    onSelect(option);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: DropdownOption<T> }) => {
    const isSelected = item.id === selectedOptionId;
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          {
            borderColor: theme.border,
            backgroundColor: isSelected ? (theme.isDark ? '#2C2C2E' : '#E5E5EA') : 'transparent',
          },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? theme.accent : theme.text,
              fontFamily: isSelected ? Fonts.bold : Fonts.semiBold,
            },
          ]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <Text style={[styles.checkmark, { color: theme.accent }]}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[
          styles.triggerButton,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: theme.textSecondary }]}>
          ▼ {selectedOption ? selectedOption.label : 'Select'}
        </Text>
      </TouchableOpacity>

      {/* Dropdown Overlay Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType={isTablet ? 'fade' : 'slide'}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalBackdrop,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                justifyContent: isTablet ? 'center' : 'flex-end',
                alignItems: isTablet ? 'center' : 'stretch',
              },
            ]}
          >
            {/* Prevent touch events inside the card from propagating to backdrop */}
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderWidth: isTablet ? 1 : 0,
                    width: isTablet ? 340 : '100%',
                    maxHeight: isTablet ? 450 : 380,
                    borderRadius: isTablet ? 24 : 0,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingBottom: isTablet ? 24 : Math.max(24, insets.bottom),
                  },
                ]}
              >
                {/* Drag Indicator for Phones Bottom-Sheet style */}
                {!isTablet && <View style={[styles.dragIndicator, { backgroundColor: theme.border }]} />}

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textSecondary }]}>
                    {title}
                  </Text>
                </View>

                {/* Options List */}
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerButton: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  triggerText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 0,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  optionItem: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 14,
  },
  checkmark: {
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});
