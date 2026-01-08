import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactMessageRepository: Repository<ContactMessage>,
  ) {}

  async create(createContactMessageDto: CreateContactMessageDto): Promise<ContactMessage> {
    const message = this.contactMessageRepository.create(createContactMessageDto);
    return await this.contactMessageRepository.save(message);
  }

  async findAll(): Promise<ContactMessage[]> {
    return await this.contactMessageRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ContactMessage> {
    return await this.contactMessageRepository.findOne({ where: { id } });
  }

  async markAsRead(id: number): Promise<ContactMessage> {
    const message = await this.findOne(id);
    if (!message) {
      throw new Error('Message not found');
    }
    message.isRead = true;
    return await this.contactMessageRepository.save(message);
  }

  async delete(id: number): Promise<void> {
    await this.contactMessageRepository.delete(id);
  }

  async getUnreadCount(): Promise<number> {
    return await this.contactMessageRepository.count({
      where: { isRead: false },
    });
  }
}
