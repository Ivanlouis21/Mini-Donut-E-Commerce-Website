import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a contact message', description: 'Submit a contact message from the contact form' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createContactMessageDto: CreateContactMessageDto) {
    return this.contactService.create(createContactMessageDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all contact messages', description: 'Retrieve all contact messages (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of contact messages' })
  findAll() {
    return this.contactService.findAll();
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread messages count', description: 'Get count of unread messages (Admin only)' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount() {
    const count = await this.contactService.getUnreadCount();
    return count;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a contact message', description: 'Retrieve a specific contact message (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact message details' })
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark message as read', description: 'Mark a contact message as read (Admin only)' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a contact message', description: 'Delete a contact message (Admin only)' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  delete(@Param('id') id: string) {
    return this.contactService.delete(+id);
  }
}
